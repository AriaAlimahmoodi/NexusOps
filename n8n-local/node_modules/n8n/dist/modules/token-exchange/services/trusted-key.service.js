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
exports.TrustedKeyService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const trusted_key_source_entity_1 = require("../database/entities/trusted-key-source.entity");
const trusted_key_source_repository_1 = require("../database/repositories/trusted-key-source.repository");
const trusted_key_repository_1 = require("../database/repositories/trusted-key.repository");
const token_exchange_config_1 = require("../token-exchange.config");
const token_exchange_schemas_1 = require("../token-exchange.schemas");
const jwks_resolver_1 = require("./jwks-resolver");
const ALGORITHM_FAMILY = {
    RS256: 'RSA',
    RS384: 'RSA',
    RS512: 'RSA',
    PS256: 'RSA',
    PS384: 'RSA',
    PS512: 'RSA',
    ES256: 'EC',
    ES384: 'EC',
    ES512: 'EC',
};
const STATIC_SOURCE_ID = 'static';
let TrustedKeyService = class TrustedKeyService {
    constructor(logger, config, trustedKeySourceRepository, trustedKeyRepository, dbLockService, jwksResolverService) {
        this.config = config;
        this.trustedKeySourceRepository = trustedKeySourceRepository;
        this.trustedKeyRepository = trustedKeyRepository;
        this.dbLockService = dbLockService;
        this.jwksResolverService = jwksResolverService;
        this.cryptoCache = new Map();
        this.logger = logger.scoped('token-exchange');
    }
    async initialize() {
        const sources = this.parseConfigSources();
        await this.syncSourcesToDb(sources);
        await this.refreshAllSources();
    }
    async onLeaderTakeover() {
        await this.refreshAllSources();
    }
    async getByKidAndIss(kid, issuer) {
        const entities = await this.trustedKeyRepository.findAllByKid(kid);
        if (entities.length === 0)
            return undefined;
        for (const entity of entities) {
            let data;
            try {
                const parsed = token_exchange_schemas_1.TrustedKeyDataSchema.safeParse(JSON.parse(entity.data));
                if (!parsed.success) {
                    this.logger.warn('Skipping corrupted trusted key entity', {
                        kid,
                        sourceId: entity.sourceId,
                        error: parsed.error.message,
                    });
                    continue;
                }
                data = parsed.data;
            }
            catch {
                this.logger.warn('Skipping corrupted trusted key entity', {
                    kid,
                    sourceId: entity.sourceId,
                    error: 'invalid JSON',
                });
                continue;
            }
            if (data.issuer !== issuer)
                continue;
            const cryptoKey = this.resolveCryptoKey(`${entity.sourceId}:${kid}`, data.keyMaterial);
            if (!cryptoKey)
                continue;
            return {
                kid,
                algorithms: data.algorithms,
                key: cryptoKey,
                issuer: data.issuer,
                expectedAudience: data.expectedAudience,
                allowedRoles: data.allowedRoles,
                requireVerifiedEmail: data.requireVerifiedEmail ?? true,
            };
        }
        return undefined;
    }
    async refreshSource(sourceId) {
        const source = await this.trustedKeySourceRepository.findOneBy({ id: sourceId });
        if (!source) {
            throw new n8n_workflow_1.UnexpectedError(`Trusted key source not found: ${sourceId}`);
        }
        await this.refreshSourceInternal(source);
    }
    async listAll() {
        return await this.trustedKeyRepository.find();
    }
    async listSources() {
        return await this.trustedKeySourceRepository.find();
    }
    parseConfigSources() {
        const raw = this.config.trustedKeys;
        if (!raw) {
            this.logger.info('No trusted keys configured');
            return [];
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (error) {
            this.logger.error('Failed to parse trusted keys JSON', { error });
            throw new n8n_workflow_1.UnexpectedError('Failed to parse trusted keys JSON');
        }
        const result = zod_1.z.array(token_exchange_schemas_1.TrustedKeySourceSchema).safeParse(parsed);
        if (!result.success) {
            this.logger.error('Trusted keys JSON has invalid format', { error: result.error });
            throw new n8n_workflow_1.UnexpectedError('Trusted keys JSON has invalid format');
        }
        return result.data;
    }
    async hasSingleTrustedIssuer() {
        const sources = await this.listAll();
        const issuers = new Set();
        sources.forEach((entity) => {
            try {
                const parsed = token_exchange_schemas_1.TrustedKeyDataSchema.safeParse(JSON.parse(entity.data));
                if (!parsed.success) {
                    this.logger.warn('Skipping corrupted trusted key entity', {
                        kid: entity.kid,
                        sourceId: entity.sourceId,
                        error: parsed.error.message,
                    });
                    return;
                }
                issuers.add(parsed.data.issuer);
            }
            catch {
                this.logger.warn('Skipping corrupted trusted key entity', {
                    kid: entity.kid,
                    sourceId: entity.sourceId,
                    error: 'invalid JSON',
                });
            }
        });
        return issuers.size === 1;
    }
    generateSourceId(source) {
        if (source.type === 'static')
            return STATIC_SOURCE_ID;
        return (0, node_crypto_1.createHash)('sha256').update(source.url).digest('hex').slice(0, 36);
    }
    async syncSourcesToDb(sources) {
        await this.dbLockService.withLock(1002, async (tx) => {
            this.logger.debug('Syncing sources to the database', { sources });
            const staticSources = sources.filter((s) => s.type === 'static');
            const jwksSources = sources.filter((s) => s.type === 'jwks');
            const expectedSourceIds = new Set();
            if (staticSources.length > 0) {
                const sourceId = STATIC_SOURCE_ID;
                expectedSourceIds.add(sourceId);
                await tx.save(trusted_key_source_entity_1.TrustedKeySourceEntity, {
                    id: sourceId,
                    type: 'static',
                    config: JSON.stringify(staticSources),
                    status: 'pending',
                });
            }
            for (const jwks of jwksSources) {
                const sourceId = this.generateSourceId(jwks);
                expectedSourceIds.add(sourceId);
                await tx.save(trusted_key_source_entity_1.TrustedKeySourceEntity, {
                    id: sourceId,
                    type: 'jwks',
                    config: JSON.stringify(jwks),
                    status: 'pending',
                });
            }
            if (expectedSourceIds.size > 0) {
                await tx.delete(trusted_key_source_entity_1.TrustedKeySourceEntity, {
                    id: (0, typeorm_1.Not)((0, typeorm_1.In)([...expectedSourceIds])),
                });
            }
            else {
                await tx.delete(trusted_key_source_entity_1.TrustedKeySourceEntity, {});
            }
        });
    }
    async refreshAllSources() {
        try {
            const sources = await this.trustedKeySourceRepository.find();
            for (const source of sources) {
                try {
                    await this.refreshSourceInternal(source);
                }
                catch (error) {
                    this.logger.error('Failed to refresh trusted key source', {
                        sourceId: source.id,
                        error,
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to run trusted key refresh cycle', { error });
        }
    }
    async refreshDueSources(signal) {
        this.logger.debug('Refreshing due sources');
        const sources = await this.trustedKeySourceRepository.find({ order: { updatedAt: 'ASC' } });
        const now = Date.now();
        for (const source of sources) {
            if (signal.aborted)
                return;
            const intervalMs = this.getRefreshIntervalMs(source);
            const lastRefresh = source.lastRefreshedAt?.getTime() ?? 0;
            if (now - lastRefresh >= intervalMs) {
                await this.refreshSourceInternal(source);
            }
        }
    }
    getRefreshIntervalMs(source) {
        if (source.type === 'jwks') {
            try {
                const config = (0, n8n_workflow_1.jsonParse)(source.config);
                if (typeof config.cacheTtlSeconds === 'number' && config.cacheTtlSeconds > 0) {
                    return config.cacheTtlSeconds * constants_1.Time.seconds.toMilliseconds;
                }
            }
            catch (e) {
                this.logger.warn('Failed to parse source configuration for jwks source', {
                    id: source.id,
                    error: e,
                });
            }
        }
        return this.config.keyRefreshIntervalSeconds * constants_1.Time.seconds.toMilliseconds;
    }
    async refreshSourceInternal(source) {
        try {
            await this.dbLockService.withLockContext(1002, async (ctx) => await this.trustedKeySourceRepository.refreshSource(source.id, async (freshSource) => await this.resolveKeysForSource(freshSource), ctx));
        }
        catch (error) {
            const failure = (0, ensure_error_1.ensureError)(error);
            await this.trustedKeySourceRepository.update(source.id, {
                status: 'error',
                lastError: failure.message,
            });
            throw failure;
        }
    }
    async resolveKeysForSource(source) {
        switch (source.type) {
            case 'static':
                return this.resolveKeysForStaticSource(source);
            case 'jwks':
                return await this.resolveKeysForJwksSource(source);
            default:
                this.logger.warn('Unknown key source type, skipping', {
                    sourceId: source.id,
                    type: source.type,
                });
                return undefined;
        }
    }
    async resolveKeysForJwksSource(source) {
        let jwksConfig;
        try {
            jwksConfig = (0, n8n_workflow_1.jsonParse)(source.config);
        }
        catch {
            throw new n8n_workflow_1.UnexpectedError('Invalid JWKS source config: malformed JSON');
        }
        const result = await this.jwksResolverService.resolveKeys(jwksConfig);
        if (result.skipped.length > 0) {
            this.logger.debug(`JWKS "${jwksConfig.url}": skipped ${result.skipped.length} key(s)`, {
                skipped: result.skipped,
            });
        }
        return {
            keys: result.keys.map((key) => ({
                kid: key.kid,
                data: {
                    algorithms: key.algorithms,
                    keyMaterial: key.keyMaterial,
                    issuer: key.issuer,
                    expectedAudience: key.expectedAudience,
                    allowedRoles: key.allowedRoles,
                    requireVerifiedEmail: jwksConfig.requireVerifiedEmail ?? true,
                    expiresAt: new Date(Date.now() + result.ttlSeconds * 1000).toISOString(),
                },
            })),
            cacheTtlSeconds: result.ttlSeconds,
        };
    }
    resolveKeysForStaticSource(source) {
        let rawConfig;
        try {
            rawConfig = JSON.parse(source.config);
        }
        catch {
            throw new n8n_workflow_1.UnexpectedError('Invalid static source config: malformed JSON');
        }
        const configResult = zod_1.z.array(token_exchange_schemas_1.TrustedKeySourceSchema).safeParse(rawConfig);
        if (!configResult.success) {
            throw new n8n_workflow_1.UnexpectedError(`Invalid static source config: ${configResult.error.message}`);
        }
        const staticConfigs = configResult.data.filter((s) => s.type === 'static');
        return {
            keys: this.resolveStaticKeys(staticConfigs),
        };
    }
    resolveStaticKeys(configs) {
        const result = [];
        const seenKids = new Set();
        for (const config of configs) {
            const { kid, algorithms, key: pemString, issuer, expectedAudience, allowedRoles, requireVerifiedEmail, } = config;
            if (seenKids.has(kid)) {
                throw new n8n_workflow_1.UnexpectedError(`Trusted key "${kid}": duplicate kid`);
            }
            seenKids.add(kid);
            this.validateKeyMaterial(kid, algorithms, pemString);
            result.push({
                kid,
                data: {
                    algorithms,
                    keyMaterial: pemString,
                    issuer,
                    expectedAudience,
                    allowedRoles,
                    requireVerifiedEmail,
                },
            });
        }
        return result;
    }
    validateKeyMaterial(kid, algorithms, pemString) {
        const families = new Set();
        for (const alg of algorithms) {
            const family = ALGORITHM_FAMILY[alg];
            if (!family) {
                throw new n8n_workflow_1.UnexpectedError(`Trusted key "${kid}": unknown algorithm "${alg}"`);
            }
            families.add(family);
        }
        if (families.size > 1) {
            throw new n8n_workflow_1.UnexpectedError(`Trusted key "${kid}": algorithms must belong to the same family, got ${[...families].join(', ')}`);
        }
        const family = [...families][0];
        let keyObject;
        try {
            keyObject = (0, node_crypto_1.createPublicKey)(pemString);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'unknown error';
            throw new n8n_workflow_1.UnexpectedError(`Trusted key "${kid}": failed to parse public key — ${message}`);
        }
        const keyType = keyObject.asymmetricKeyType;
        const expectedTypes = {
            RSA: ['rsa'],
            EC: ['ec'],
        };
        if (!expectedTypes[family].includes(keyType ?? '')) {
            throw new n8n_workflow_1.UnexpectedError(`Trusted key "${kid}": key type "${keyType}" does not match algorithm family "${family}"`);
        }
    }
    resolveCryptoKey(cacheKey, keyMaterial) {
        const hash = (0, node_crypto_1.createHash)('sha256').update(keyMaterial).digest('hex');
        const cached = this.cryptoCache.get(cacheKey);
        if (cached && cached.keyMaterialHash === hash) {
            return cached.cryptoKey;
        }
        try {
            const cryptoKey = (0, node_crypto_1.createPublicKey)(keyMaterial);
            this.cryptoCache.set(cacheKey, { keyMaterialHash: hash, cryptoKey });
            return cryptoKey;
        }
        catch (error) {
            this.logger.warn('Failed to parse key material from DB', {
                cacheKey,
                error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        }
    }
};
exports.TrustedKeyService = TrustedKeyService;
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrustedKeyService.prototype, "onLeaderTakeover", null);
exports.TrustedKeyService = TrustedKeyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, token_exchange_config_1.TokenExchangeConfig, trusted_key_source_repository_1.TrustedKeySourceRepository, trusted_key_repository_1.TrustedKeyRepository, db_1.DbLockService, jwks_resolver_1.JwksResolverService])
], TrustedKeyService);
//# sourceMappingURL=trusted-key.service.js.map