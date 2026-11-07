"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthJweKeyService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const jose_1 = require("jose");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const oauth_jwe_constants_1 = require("./oauth-jwe.constants");
const EARLIER_WRAP_PREFIX = 'U2FsdGVkX1';
let OAuthJweKeyService = class OAuthJweKeyService {
    constructor(deploymentKeyRepository, cipher, cacheService, logger) {
        this.deploymentKeyRepository = deploymentKeyRepository;
        this.cipher = cipher;
        this.cacheService = cacheService;
        this.logger = logger;
        this.logger = this.logger.scoped('oauth-jwe');
    }
    async initialize() {
        await this.loadData();
    }
    async getKeyPair(algorithm = oauth_jwe_constants_1.JWE_KEY_ALGORITHMS[0]) {
        const entry = await this.findEntry(algorithm);
        return await this.deriveKeyPair(entry);
    }
    async getPublicJwk(algorithm = oauth_jwe_constants_1.JWE_KEY_ALGORITHMS[0]) {
        const { publicJwk } = await this.getKeyPair(algorithm);
        return publicJwk;
    }
    async getPublicJwks() {
        const data = await this.loadData();
        return await Promise.all(data.map(async (entry) => (await this.deriveKeyPair(entry)).publicJwk));
    }
    async findEntry(algorithm) {
        const data = await this.loadData();
        const entry = data.find((e) => e.algorithm === algorithm);
        if (!entry) {
            throw new n8n_workflow_1.UnexpectedError(`No active OAuth JWE key found for algorithm "${algorithm}"`);
        }
        return entry;
    }
    async loadData() {
        const data = await this.cacheService.get(oauth_jwe_constants_1.JWE_KEY_CACHE_KEY, {
            refreshFn: async () => await this.loadOrGenerate(),
        });
        if (!data || data.length === 0) {
            throw new n8n_workflow_1.UnexpectedError('OAuth JWE key pair unavailable');
        }
        return data;
    }
    unwrapPrivateJwk(value) {
        if (value.startsWith(EARLIER_WRAP_PREFIX)) {
            return this.cipher.decryptWithInstanceKey(value);
        }
        return this.cipher.decryptDEKWithInstanceKey(value);
    }
    async deriveKeyPair(entry) {
        const decryptedPrivate = this.unwrapPrivateJwk(entry.encryptedPrivateJwk);
        const privateJwk = (0, n8n_workflow_1.jsonParse)(decryptedPrivate, {
            errorMessage: 'Failed to parse OAuth JWE private key',
        });
        const publicJwk = toPublicJwk(privateJwk, entry.algorithm);
        const [publicKey, privateKey] = await Promise.all([
            (0, jose_1.importJWK)(publicJwk, entry.algorithm),
            (0, jose_1.importJWK)(privateJwk, entry.algorithm),
        ]);
        return {
            algorithm: entry.algorithm,
            publicKey: publicKey,
            privateKey: privateKey,
            publicJwk,
            kid: entry.kid,
        };
    }
    async loadOrGenerate() {
        const entries = [];
        for (const algorithm of oauth_jwe_constants_1.JWE_KEY_ALGORITHMS) {
            let entry = await this.readActiveEntry(algorithm);
            if (!entry) {
                await this.generateAndPersist(algorithm);
                entry = await this.readActiveEntry(algorithm);
            }
            if (!entry) {
                throw new n8n_workflow_1.UnexpectedError(`OAuth JWE key for algorithm "${algorithm}" not found after generation`);
            }
            entries.push(entry);
        }
        return entries;
    }
    async readActiveEntry(algorithm) {
        const privateRow = await this.deploymentKeyRepository.findActiveOAuthJweKey(algorithm);
        if (!privateRow)
            return null;
        const decryptedPrivate = this.unwrapPrivateJwk(privateRow.value);
        const privateJwk = (0, n8n_workflow_1.jsonParse)(decryptedPrivate, {
            errorMessage: 'Failed to parse OAuth JWE private key',
        });
        if (!privateJwk.kid) {
            throw new n8n_workflow_1.UnexpectedError(`OAuth JWE private key for "${algorithm}" is missing a kid`);
        }
        if (privateJwk.kid !== privateRow.id) {
            throw new n8n_workflow_1.UnexpectedError(`OAuth JWE private key for "${algorithm}" has a kid that does not match its row id`);
        }
        return {
            algorithm,
            encryptedPrivateJwk: privateRow.value,
            kid: privateRow.id,
        };
    }
    async generateAndPersist(algorithm) {
        const { privateKey } = await (0, jose_1.generateKeyPair)(algorithm, { extractable: true });
        const id = (0, generate_nano_id_1.generateNanoId)();
        const privateJwk = {
            ...(await (0, jose_1.exportJWK)(privateKey)),
            kid: id,
            alg: algorithm,
            use: oauth_jwe_constants_1.JWE_KEY_USE,
        };
        const encryptedPrivate = this.cipher.encryptDEKWithInstanceKey(JSON.stringify(privateJwk));
        try {
            await this.deploymentKeyRepository.insertActiveOAuthJweKey(id, encryptedPrivate, algorithm);
            this.logger.info('Generated new instance OAuth JWE key pair', { algorithm, kid: id });
        }
        catch (error) {
            if (!(0, db_1.isUniqueConstraintError)(error))
                throw error;
            this.logger.debug('OAuth JWE key insert raced with another main; re-reading winner', error instanceof Error ? { algorithm, message: error.message } : { algorithm });
        }
    }
};
exports.OAuthJweKeyService = OAuthJweKeyService;
exports.OAuthJweKeyService = OAuthJweKeyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.DeploymentKeyRepository, n8n_core_1.Cipher, backend_services_1.CacheService, backend_common_1.Logger])
], OAuthJweKeyService);
const PUBLIC_JWK_FIELDS = {
    'RSA-OAEP-256': ['kty', 'kid', 'alg', 'use', 'n', 'e'],
};
function toPublicJwk(privateJwk, algorithm) {
    const allowed = PUBLIC_JWK_FIELDS[algorithm];
    const entries = allowed
        .filter((field) => privateJwk[field] !== undefined)
        .map((field) => [field, privateJwk[field]]);
    return Object.fromEntries(entries);
}
//# sourceMappingURL=oauth-jwe-key.service.js.map