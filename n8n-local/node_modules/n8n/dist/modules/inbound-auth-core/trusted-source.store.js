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
exports.TrustedSourceDbStore = exports.HEALTHY_REFRESH_SECONDS = exports.ERROR_RETRY_SECONDS = exports.SystemTrustedSourceModificationError = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const inbound_auth_1 = require("@n8n/inbound-auth");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const trusted_source_identity_repository_1 = require("./database/repositories/trusted-source-identity.repository");
const trusted_source_repository_1 = require("./database/repositories/trusted-source.repository");
const db_1 = require("@n8n/db");
const constants_1 = require("@n8n/constants");
const backend_services_1 = require("@n8n/backend-services");
class SystemTrustedSourceModificationError extends n8n_workflow_1.UserError {
    constructor(action) {
        super(`Cannot ${action} a system-managed trusted source.`);
    }
}
exports.SystemTrustedSourceModificationError = SystemTrustedSourceModificationError;
const idKey = (id) => `trusted-source:id:${id}`;
const issuerKey = (issuer) => `trusted-source:issuer:${issuer}`;
const ALL_KEY = 'trusted-source:all';
const CACHE_TTL = 5 * constants_1.Time.minutes.toMilliseconds;
const DISCOVERY_LEASE_SECONDS = 60;
exports.ERROR_RETRY_SECONDS = 5 * constants_1.Time.minutes.toSeconds;
exports.HEALTHY_REFRESH_SECONDS = 1 * constants_1.Time.hours.toSeconds;
let TrustedSourceDbStore = class TrustedSourceDbStore extends inbound_auth_1.TrustedSourceStore {
    constructor(logger, trustedSourceRepository, cipher, cacheService, trustedSourceIdentityRepository, transactionRunner) {
        super();
        this.logger = logger;
        this.trustedSourceRepository = trustedSourceRepository;
        this.cipher = cipher;
        this.cacheService = cacheService;
        this.trustedSourceIdentityRepository = trustedSourceIdentityRepository;
        this.transactionRunner = transactionRunner;
    }
    async getById(id) {
        return await this.cacheService.get(idKey(id), {
            ttl: CACHE_TTL,
            refreshFn: async () => await this.load(await this.trustedSourceRepository.findById(id)),
        });
    }
    async getByIssuer(issuer) {
        return await this.cacheService.get(issuerKey(issuer), {
            ttl: CACHE_TTL,
            refreshFn: async () => await this.load(await this.trustedSourceRepository.findByIssuer(issuer)),
        });
    }
    async listAll() {
        return ((await this.cacheService.get(ALL_KEY, {
            ttl: CACHE_TTL,
            refreshFn: async () => await this.loadAll(),
        })) ?? []);
    }
    async listBySurface(surface) {
        const all = await this.listAll();
        return all.filter((source) => source.config.surfaces[surface] !== undefined);
    }
    async listDue(limit) {
        const rows = await this.trustedSourceRepository.findDue({
            errorRetrySeconds: exports.ERROR_RETRY_SECONDS,
            healthyRefreshSeconds: exports.HEALTHY_REFRESH_SECONDS,
            limit,
        });
        const sources = await Promise.all(rows.map(async (row) => await this.load(row)));
        return sources.filter((source) => source !== undefined);
    }
    async claimDiscovery(source) {
        const token = (0, node_crypto_1.randomUUID)();
        const claimed = await this.trustedSourceRepository.claimForDiscovery(source.id, token, DISCOVERY_LEASE_SECONDS);
        if (!claimed)
            return null;
        await this.invalidateCache(source);
        return token;
    }
    async recordDiscovery(source, token, result) {
        const recorded = await this.trustedSourceRepository.recordDiscovery(source.id, token, {
            status: result.status,
            lastError: result.lastError,
            ...(result.metadata && { metadata: JSON.stringify(result.metadata) }),
        });
        if (recorded)
            await this.invalidateCache(source);
        return recorded;
    }
    async create(input) {
        const config = (0, inbound_auth_1.migrateToLatest)((0, inbound_auth_1.trustedSourceConfigSchemaFor)('admin').parse(input.config));
        const row = await this.trustedSourceRepository.insertRow({
            name: input.name,
            issuer: input.issuer,
            type: config.authentication.type,
            managedBy: 'admin',
            status: 'unchecked',
            lastError: null,
            lastCheckedAt: null,
            configVersion: config.version,
            config: await this.cipher.encryptV2(config),
            metadata: null,
        });
        await this.invalidateCache(row);
        return this.toRuntime(row, config);
    }
    async update(id, input, options) {
        const row = await this.loadAdminRow(id, 'update');
        const changes = {};
        if (input.name !== undefined)
            changes.name = input.name;
        if (input.issuer !== undefined)
            changes.issuer = input.issuer;
        if (input.config !== undefined) {
            const config = (0, inbound_auth_1.migrateToLatest)((0, inbound_auth_1.trustedSourceConfigSchemaFor)(row.managedBy).parse(input.config));
            changes.configVersion = config.version;
            changes.config = await this.cipher.encryptV2(config);
        }
        if (input.issuer !== undefined || input.config !== undefined) {
            changes.metadata = null;
            changes.status = 'unchecked';
            changes.lastError = null;
            changes.discoveryClaimToken = null;
            changes.discoveryClaimedAt = null;
        }
        await this.transactionRunner.run({}, async (ctx) => {
            if (Object.keys(changes).length > 0) {
                await this.trustedSourceRepository.updateById(id, changes, ctx);
            }
            if (options?.clearBindings) {
                await this.trustedSourceIdentityRepository.clearByTrustedSourceId(id, ctx);
            }
        });
        await this.invalidateCache(row, changes.issuer);
    }
    async delete(id) {
        const row = await this.loadAdminRow(id, 'delete');
        await this.trustedSourceRepository.deleteById(id);
        await this.invalidateCache(row);
    }
    async seedSystemSource(input) {
        const { id, name, issuer } = input;
        const existing = await this.trustedSourceRepository.findById(id);
        if (!existing) {
            const config = (0, inbound_auth_1.migrateToLatest)((0, inbound_auth_1.trustedSourceConfigSchemaFor)('system').parse(input.config));
            await this.trustedSourceRepository.insertIfAbsent({
                id,
                name,
                issuer,
                type: config.authentication.type,
                managedBy: 'system',
                status: 'unchecked',
                lastError: null,
                lastCheckedAt: null,
                configVersion: config.version,
                config: await this.cipher.encryptV2(config),
                metadata: null,
            });
            if (!(await this.trustedSourceRepository.findById(id)))
                return 'conflict';
            await this.invalidateCache({ id, issuer });
            return 'inserted';
        }
        if (existing.managedBy !== 'system')
            return 'conflict';
        if (existing.issuer === issuer)
            return 'unchanged';
        const holder = await this.trustedSourceRepository.findByIssuer(issuer);
        if (holder)
            return holder.id === id ? 'unchanged' : 'conflict';
        try {
            await this.trustedSourceRepository.updateById(id, {
                issuer,
                lastCheckedAt: null,
                discoveryClaimToken: null,
                discoveryClaimedAt: null,
            });
        }
        catch (error) {
            const winner = await this.trustedSourceRepository.findByIssuer(issuer);
            if (!winner)
                throw error;
            return winner.id === id ? 'unchanged' : 'conflict';
        }
        await this.invalidateCache(existing, issuer);
        return 'issuer-updated';
    }
    async loadAdminRow(id, action) {
        const row = await this.trustedSourceRepository.findById(id);
        if (!row)
            throw new errors_1.NotFoundError(`Trusted source "${id}" not found`);
        if (row.managedBy === 'system')
            throw new SystemTrustedSourceModificationError(action);
        return row;
    }
    async invalidateCache(row, newIssuer = row.issuer) {
        await this.cacheService.deleteMany([
            idKey(row.id),
            issuerKey(row.issuer),
            issuerKey(newIssuer),
            ALL_KEY,
        ]);
    }
    async load(row) {
        if (!row)
            return undefined;
        try {
            const document = (0, n8n_workflow_1.jsonParse)(await this.cipher.decryptV2(row.config));
            const config = (0, inbound_auth_1.trustedSourceConfigSchemaFor)(row.managedBy).parse(document);
            return this.toRuntime(row, (0, inbound_auth_1.migrateToLatest)(config));
        }
        catch (error) {
            this.logger.warn('Skipping unusable trusted source', {
                id: row.id,
                reason: (0, ensure_error_1.ensureError)(error).message,
            });
            return undefined;
        }
    }
    async loadAll() {
        const rows = await this.trustedSourceRepository.findAll();
        const sources = await Promise.all(rows.map(async (row) => await this.load(row)));
        return sources.filter((source) => source !== undefined);
    }
    toRuntime(row, config) {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            issuer: row.issuer,
            managedBy: row.managedBy,
            status: row.status,
            lastError: row.lastError,
            lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            config,
            metadata: this.parseMetadata(row),
        };
    }
    parseMetadata(row) {
        if (row.metadata === null)
            return null;
        const parsed = inbound_auth_1.TrustedSourceMetadataSchema.safeParse((0, n8n_workflow_1.jsonParse)(row.metadata, { fallbackValue: null }));
        if (parsed.success)
            return parsed.data;
        this.logger.warn('Ignoring unreadable trusted source metadata', {
            id: row.id,
            reason: parsed.error.message,
        });
        return null;
    }
};
exports.TrustedSourceDbStore = TrustedSourceDbStore;
exports.TrustedSourceDbStore = TrustedSourceDbStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, trusted_source_repository_1.TrustedSourceRepository, n8n_core_1.Cipher, backend_services_1.CacheService, trusted_source_identity_repository_1.TrustedSourceIdentityRepository, db_1.TransactionRunner])
], TrustedSourceDbStore);
//# sourceMappingURL=trusted-source.store.js.map