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
exports.OAuthSigningKeyService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const jsonwebtoken_1 = require("jsonwebtoken");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const backend_services_1 = require("@n8n/backend-services");
const oauth_signing_key_constants_1 = require("./oauth-signing-key.constants");
const generateKeyPairAsync = (0, node_util_1.promisify)(node_crypto_1.generateKeyPair);
const PUBLIC_JWK_FIELDS = ['kty', 'crv', 'x', 'y', 'kid', 'alg', 'use'];
let OAuthSigningKeyService = class OAuthSigningKeyService {
    constructor(deploymentKeyRepository, cipher, logger, jwtService) {
        this.deploymentKeyRepository = deploymentKeyRepository;
        this.cipher = cipher;
        this.logger = logger;
        this.jwtService = jwtService;
        this.activeKey = null;
        this.publishedKeys = null;
        this.pendingRead = null;
        this.keysGeneration = 0;
    }
    async initialize() {
        let row = await this.deploymentKeyRepository.findActiveOAuthSigningKey(oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM);
        if (!row) {
            await this.generateAndPersist();
            row = await this.deploymentKeyRepository.findActiveOAuthSigningKey(oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM);
        }
        if (!row) {
            throw new n8n_workflow_1.UnexpectedError('OAuth signing key not found after generation');
        }
        const privateJwk = this.readPrivateJwk(row);
        this.activeKey = {
            kid: row.id,
            privateKey: (0, node_crypto_1.createPrivateKey)({ key: privateJwk, format: 'jwk' }),
        };
    }
    signAccessToken(payload, audience) {
        if (!this.activeKey) {
            throw new n8n_workflow_1.UnexpectedError('OAuth signing key is not initialized');
        }
        const { kid, privateKey } = this.activeKey;
        return this.jwtService.signForResource(payload, audience, privateKey, {
            algorithm: oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM,
            header: { alg: oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM, typ: 'at+jwt', kid },
        });
    }
    async getPublicJwks() {
        const keys = await this.loadPublishedKeys();
        return keys.map((key) => key.publicJwk);
    }
    async verifyAccessToken(token, { kid, audiences, issuer }) {
        if (typeof kid !== 'string' || kid.length === 0) {
            throw new jsonwebtoken_1.JsonWebTokenError('kid is invalid');
        }
        const key = await this.findPublishedKey(kid);
        if (!key) {
            throw new jsonwebtoken_1.JsonWebTokenError('kid is unknown');
        }
        const verified = this.jwtService.verifyForResource(token, audiences, key.publicKey, { algorithms: [oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM], issuer });
        const { typ } = verified.header;
        if (typeof typ !== 'string' || !oauth_signing_key_constants_1.ACCESS_TOKEN_TYPES.some((t) => t === typ.toLowerCase())) {
            throw new jsonwebtoken_1.JsonWebTokenError('typ is invalid');
        }
        const { payload } = verified;
        if (typeof payload !== 'object' || typeof payload.exp !== 'number') {
            throw new jsonwebtoken_1.JsonWebTokenError('exp is missing');
        }
        return payload;
    }
    async findPublishedKey(kid) {
        const keys = await this.loadPublishedKeys(oauth_signing_key_constants_1.SIGNING_KEYS_REFRESH_MS);
        const key = keys.find((k) => k.kid === kid);
        if (key)
            return key;
        const refreshed = await this.loadPublishedKeys(oauth_signing_key_constants_1.UNKNOWN_KID_REFRESH_MS);
        return refreshed.find((k) => k.kid === kid);
    }
    async loadPublishedKeys(maxAgeMs = oauth_signing_key_constants_1.SIGNING_KEYS_REFRESH_MS) {
        let list = this.publishedKeys;
        if (!list || Date.now() - list.readAt >= maxAgeMs) {
            list = await this.readPublishedKeys();
        }
        const now = Date.now();
        return list.keys.filter((key) => key.active || now - key.updatedAt <= oauth_signing_key_constants_1.RETIRED_SIGNING_KEY_GRACE_MS);
    }
    async readPublishedKeys() {
        if (!this.pendingRead) {
            const generation = this.keysGeneration;
            this.pendingRead = this.readPublishedKeyRows()
                .then((list) => {
                if (generation === this.keysGeneration)
                    this.publishedKeys = list;
                return list;
            })
                .finally(() => {
                if (generation === this.keysGeneration)
                    this.pendingRead = null;
            });
        }
        return await this.pendingRead;
    }
    async readPublishedKeyRows() {
        const rows = await this.deploymentKeyRepository.findOAuthSigningKeys();
        const keys = rows
            .filter((row) => row.algorithm === oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM)
            .map((row) => {
            const publicJwk = toPublicJwk(this.readPrivateJwk(row));
            const { kty, crv, x, y } = publicJwk;
            return {
                kid: row.id,
                publicJwk,
                publicKey: (0, node_crypto_1.createPublicKey)({ key: { kty, crv, x, y }, format: 'jwk' }),
                active: row.status === 'active',
                updatedAt: new Date(row.updatedAt).getTime(),
            };
        });
        return { keys, readAt: Date.now() };
    }
    readPrivateJwk(row) {
        const privateJwk = (0, n8n_workflow_1.jsonParse)(this.cipher.decryptDEKWithInstanceKey(row.value), {
            errorMessage: 'Failed to parse OAuth signing key',
        });
        if (privateJwk.kid !== row.id) {
            throw new n8n_workflow_1.UnexpectedError('OAuth signing key has a kid that does not match its row id');
        }
        return privateJwk;
    }
    async generateAndPersist() {
        const { privateKey } = await generateKeyPairAsync('ec', {
            namedCurve: oauth_signing_key_constants_1.OAUTH_SIGNING_CURVE,
        });
        const id = (0, generate_nano_id_1.generateNanoId)();
        const privateJwk = {
            ...privateKey.export({ format: 'jwk' }),
            kid: id,
            alg: oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM,
            use: oauth_signing_key_constants_1.OAUTH_SIGNING_KEY_USE,
        };
        const encryptedPrivate = this.cipher.encryptDEKWithInstanceKey(JSON.stringify(privateJwk));
        try {
            await this.deploymentKeyRepository.insertActiveOAuthSigningKey(id, encryptedPrivate, oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM);
        }
        catch (error) {
            if (!(0, db_1.isUniqueConstraintError)(error))
                throw error;
            this.logger.debug('OAuth signing key insert raced with another process; re-reading winner');
            return;
        }
        this.logger.info('Generated new OAuth access-token signing key', { kid: id });
        this.reloadPublishedKeys();
        await this.broadcastReloadSigningKeysCommand();
    }
    async broadcastReloadSigningKeysCommand() {
        try {
            const { Publisher } = await import('../../scaling/pubsub/publisher.service.js');
            await di_1.Container.get(Publisher).publishCommand({ command: 'reload-oauth-signing-keys' });
        }
        catch (error) {
            this.logger.warn('Failed to tell other processes about the new OAuth signing key', {
                error,
            });
        }
    }
    reloadPublishedKeys() {
        this.keysGeneration++;
        this.publishedKeys = null;
        this.pendingRead = null;
    }
};
exports.OAuthSigningKeyService = OAuthSigningKeyService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-oauth-signing-keys'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OAuthSigningKeyService.prototype, "reloadPublishedKeys", null);
exports.OAuthSigningKeyService = OAuthSigningKeyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.DeploymentKeyRepository, n8n_core_1.Cipher, backend_common_1.Logger, backend_services_1.JwtService])
], OAuthSigningKeyService);
function toPublicJwk(privateJwk) {
    const entries = PUBLIC_JWK_FIELDS.filter((field) => privateJwk[field] !== undefined).map((field) => [field, privateJwk[field]]);
    return Object.fromEntries(entries);
}
//# sourceMappingURL=oauth-signing-key.service.js.map