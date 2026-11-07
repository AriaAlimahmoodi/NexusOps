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
exports.PublicApiKeyService = exports.PREFIX_LEGACY_API_KEY = exports.API_KEY_ISSUER = exports.API_KEY_AUDIENCE = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const crypto_1 = require("crypto");
const errors_1 = require("@n8n/errors");
const email_1 = require("../user-management/email");
const backend_services_1 = require("@n8n/backend-services");
exports.API_KEY_AUDIENCE = 'public-api';
exports.API_KEY_ISSUER = 'n8n';
const REDACT_API_KEY_REVEAL_COUNT = 4;
const REDACT_API_KEY_MAX_LENGTH = 10;
exports.PREFIX_LEGACY_API_KEY = 'n8n_api_';
let PublicApiKeyService = class PublicApiKeyService {
    constructor(apiKeyRepository, jwtService, mailer, logger) {
        this.apiKeyRepository = apiKeyRepository;
        this.jwtService = jwtService;
        this.mailer = mailer;
        this.logger = logger;
        this.getApiKeyExpiration = (apiKey) => {
            const decoded = this.jwtService.decodeUnverified(apiKey);
            return decoded?.exp ?? null;
        };
    }
    async createPublicApiKeyForUser(user, { label, expiresAt, scopes }) {
        const apiKey = this.generateApiKey(user, expiresAt);
        await this.apiKeyRepository.insert(this.apiKeyRepository.create({
            userId: user.id,
            apiKey,
            label,
            scopes,
            audience: exports.API_KEY_AUDIENCE,
        }));
        return await this.apiKeyRepository.findOneByOrFail({ apiKey });
    }
    async getRedactedApiKeys(caller, options = {}) {
        const canSeeAll = (0, permissions_1.hasGlobalScope)(caller, 'apiKey:manage');
        const includeOthers = canSeeAll && options.ownership !== 'mine';
        const ownFilter = { userId: caller.id };
        const labelFilter = options.label
            ? {
                label: (0, typeorm_1.Raw)((alias) => `LOWER(${alias}) LIKE LOWER(:label) ${db_1.LIKE_ESCAPE_CLAUSE}`, {
                    label: `%${(0, db_1.escapeLike)(options.label)}%`,
                }),
            }
            : {};
        const ownerIds = includeOthers && options.ownerIds?.length ? options.ownerIds : undefined;
        const ownerIdsFilter = ownerIds ? { userId: (0, typeorm_1.In)(ownerIds) } : {};
        const baseWhere = { audience: exports.API_KEY_AUDIENCE, ...labelFilter };
        const pageWhere = includeOthers
            ? { ...baseWhere, ...ownerIdsFilter }
            : { ...baseWhere, ...ownFilter };
        const qb = this.apiKeyRepository
            .createQueryBuilder('apiKey')
            .leftJoinAndSelect('apiKey.user', 'user')
            .setFindOptions({ where: pageWhere });
        this.applyApiKeyListSort(qb, options.sortBy);
        qb.take(options.take);
        qb.skip(options.skip);
        const [apiKeys, count] = await qb.getManyAndCount();
        const hasNarrowing = !!options.label || !!ownerIds;
        const [counts, narrowedTotals, owners] = await Promise.all([
            this.countApiKeys(caller, { ...baseWhere, ...ownFilter }, { ...baseWhere, ...ownerIdsFilter }, { canSeeAll, includeOthers, pageCount: count }),
            hasNarrowing
                ? this.countApiKeys(caller, { audience: exports.API_KEY_AUDIENCE, ...ownFilter }, { audience: exports.API_KEY_AUDIENCE }, { canSeeAll, includeOthers, pageCount: undefined })
                : Promise.resolve(null),
            canSeeAll ? this.getApiKeyOwners() : Promise.resolve([]),
        ]);
        return {
            items: apiKeys.map((apiKeyRecord) => this.toRedactedApiKey(apiKeyRecord)),
            counts,
            totals: narrowedTotals ?? counts,
            owners,
        };
    }
    async getApiKeyOwners() {
        const rows = await this.apiKeyRepository
            .createQueryBuilder('apiKey')
            .innerJoin('apiKey.user', 'user')
            .where('apiKey.audience = :audience', { audience: exports.API_KEY_AUDIENCE })
            .select('user.id', 'id')
            .addSelect('user.firstName', 'first_name')
            .addSelect('user.lastName', 'last_name')
            .addSelect('user.email', 'email')
            .addSelect('COUNT(apiKey.id)', 'key_count')
            .groupBy('user.id')
            .addGroupBy('user.firstName')
            .addGroupBy('user.lastName')
            .addGroupBy('user.email')
            .getRawMany();
        return rows.map((row) => ({
            id: row.id,
            firstName: row.first_name ?? null,
            lastName: row.last_name ?? null,
            email: row.email,
            keyCount: Number(row.key_count),
        }));
    }
    async countApiKeys(_caller, mineWhere, allWhere, { canSeeAll, includeOthers, pageCount, }) {
        if (!canSeeAll) {
            const count = pageCount ?? (await this.apiKeyRepository.countBy(mineWhere));
            return { mine: count, all: count };
        }
        return {
            mine: pageCount !== undefined && !includeOthers
                ? pageCount
                : await this.apiKeyRepository.countBy(mineWhere),
            all: pageCount !== undefined && includeOthers
                ? pageCount
                : await this.apiKeyRepository.countBy(allWhere),
        };
    }
    applyApiKeyListSort(qb, sortBy) {
        const allowList = api_types_1.LIST_API_KEYS_SORT_OPTIONS;
        const valid = sortBy !== undefined && allowList.includes(sortBy);
        if (!valid) {
            qb.addOrderBy('apiKey.createdAt', 'DESC');
            return;
        }
        const [field, order] = sortBy.split(':');
        const direction = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        if (field === 'scopes') {
            const isPostgres = qb.connection.options.type === 'postgres';
            const scopesText = isPostgres ? '"apiKey"."scopes"::text' : 'apiKey.scopes';
            const scopesCountExpr = `CASE WHEN ${scopesText} = '[]' THEN 0 ELSE LENGTH(${scopesText}) - LENGTH(REPLACE(${scopesText}, ',', '')) + 1 END`;
            qb.addSelect(scopesCountExpr, 'scopes_count');
            qb.addOrderBy('scopes_count', direction);
        }
        else {
            qb.addOrderBy(`apiKey.${field}`, direction);
        }
        if (field !== 'createdAt')
            qb.addOrderBy('apiKey.createdAt', 'DESC');
    }
    async deleteApiKey(caller, apiKeyId) {
        const canDeleteAny = (0, permissions_1.hasGlobalScope)(caller, 'apiKey:manage');
        const apiKey = await this.apiKeyRepository.findOne({
            where: {
                id: apiKeyId,
                audience: exports.API_KEY_AUDIENCE,
                ...(canDeleteAny ? {} : { userId: caller.id }),
            },
            relations: { user: true },
        });
        if (!apiKey)
            throw new errors_1.NotFoundError('API key not found');
        const result = await this.apiKeyRepository.delete({ id: apiKey.id });
        if (!result.affected)
            throw new errors_1.NotFoundError('API key not found');
        const isOwn = apiKey.userId === caller.id;
        if (!isOwn) {
            this.mailer.notifyApiKeyRevoked({ apiKey, revoker: caller }).catch((e) => {
                this.logger.error('Failed to send API key revocation email', {
                    apiKeyId: apiKey.id,
                    ownerId: apiKey.userId,
                    error: e instanceof Error ? e.message : String(e),
                });
            });
        }
        return { isOwn };
    }
    async deleteAllApiKeysForUser(user, tx) {
        return await (0, db_1.withTransaction)(this.apiKeyRepository.manager, tx, async (em) => {
            const userApiKeys = await em.find(db_1.ApiKey, {
                where: { userId: user.id, audience: exports.API_KEY_AUDIENCE },
            });
            return await Promise.all(userApiKeys.map(async (apiKey) => await em.delete(db_1.ApiKey, { id: apiKey.id })));
        });
    }
    async updateApiKeyForUser(user, apiKeyId, { label, scopes }) {
        await this.apiKeyRepository.update({ id: apiKeyId, userId: user.id }, { label, scopes });
    }
    async rotateApiKey(user, apiKeyId) {
        const apiKey = await this.apiKeyRepository.findOne({
            where: { id: apiKeyId, userId: user.id, audience: exports.API_KEY_AUDIENCE },
        });
        if (!apiKey)
            throw new errors_1.NotFoundError('API key not found');
        const expiresAt = this.getApiKeyExpiration(apiKey.apiKey);
        if (expiresAt !== null && expiresAt <= Math.floor(Date.now() / 1000)) {
            throw new errors_1.BadRequestError('Cannot rotate an expired API key');
        }
        const newApiKey = this.generateApiKey(user, expiresAt);
        await this.apiKeyRepository.update({ id: apiKey.id, userId: user.id }, { apiKey: newApiKey, lastUsedAt: null });
        apiKey.apiKey = newApiKey;
        apiKey.lastUsedAt = null;
        return apiKey;
    }
    toRedactedApiKey(apiKeyRecord) {
        const { user, ...rest } = apiKeyRecord;
        return {
            ...rest,
            apiKey: this.redactApiKey(apiKeyRecord.apiKey),
            expiresAt: this.getApiKeyExpiration(apiKeyRecord.apiKey),
            owner: {
                id: user.id,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                email: user.email,
            },
        };
    }
    redactApiKey(apiKey) {
        const visiblePart = apiKey.slice(-REDACT_API_KEY_REVEAL_COUNT);
        const redactedPart = '*'.repeat(Math.max(0, REDACT_API_KEY_MAX_LENGTH - REDACT_API_KEY_REVEAL_COUNT));
        return redactedPart + visiblePart;
    }
    generateApiKey(user, expiresAt) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        return this.jwtService.sign('publicApiKey', { sub: user.id, iss: exports.API_KEY_ISSUER, jti: (0, crypto_1.randomUUID)() }, { ...(expiresAt && { expiresIn: expiresAt - nowInSeconds }) });
    }
    apiKeyHasValidScopesForRole(role, apiKeyScopes) {
        const scopesForRole = (0, permissions_1.getApiKeyScopesForRole)(role);
        return apiKeyScopes.every((scope) => scopesForRole.includes(scope));
    }
    async apiKeyHasValidScopes(apiKey, endpointScope) {
        const apiKeyData = await this.apiKeyRepository.findOne({
            where: { apiKey, audience: exports.API_KEY_AUDIENCE },
            select: { scopes: true },
        });
        if (!apiKeyData)
            return false;
        return apiKeyData.scopes.includes(endpointScope);
    }
    async removeOwnerOnlyScopesFromApiKeys(user, tx) {
        const manager = tx ?? this.apiKeyRepository.manager;
        const ownerOnlyScopes = (0, permissions_1.getOwnerOnlyApiKeyScopes)();
        const userApiKeys = await manager.find(db_1.ApiKey, {
            where: { userId: user.id, audience: exports.API_KEY_AUDIENCE },
        });
        const keysWithOwnerScopes = userApiKeys.filter((apiKey) => apiKey.scopes.some((scope) => ownerOnlyScopes.includes(scope)));
        return await Promise.all(keysWithOwnerScopes.map(async (currentApiKey) => await manager.update(db_1.ApiKey, currentApiKey.id, {
            scopes: currentApiKey.scopes.filter((scope) => !ownerOnlyScopes.includes(scope)),
        })));
    }
};
exports.PublicApiKeyService = PublicApiKeyService;
exports.PublicApiKeyService = PublicApiKeyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ApiKeyRepository, backend_services_1.JwtService, email_1.UserManagementMailer, backend_common_1.Logger])
], PublicApiKeyService);
//# sourceMappingURL=public-api-key.service.js.map