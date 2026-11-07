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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustedSourceController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const inbound_auth_1 = require("@n8n/inbound-auth");
const n8n_workflow_1 = require("n8n-workflow");
const trusted_source_discovery_service_1 = require("./trusted-source-discovery.service");
const trusted_source_store_1 = require("./trusted-source.store");
function toSummary(source) {
    return {
        id: source.id,
        name: source.name,
        capabilities: [...(0, inbound_auth_1.deriveCapabilities)(source.config, source.metadata)],
        surfaces: Object.keys(source.config.surfaces),
    };
}
function redact(source) {
    const { client } = source.config.authentication;
    if (client?.kind !== 'registered' || client.clientSecret === undefined)
        return source;
    return {
        ...source,
        config: {
            ...source.config,
            authentication: {
                ...source.config.authentication,
                client: { ...client, clientSecret: n8n_workflow_1.CREDENTIAL_BLANKING_VALUE },
            },
        },
    };
}
function restoreSecret(config, current) {
    const { client } = config.authentication;
    if (client?.kind !== 'registered' || client.clientSecret !== n8n_workflow_1.CREDENTIAL_BLANKING_VALUE) {
        return config;
    }
    const storedClient = current.authentication.client;
    const { clientSecret: _, ...withoutSecret } = client;
    const restored = storedClient?.kind === 'registered' && storedClient.clientSecret !== undefined
        ? { ...withoutSecret, clientSecret: storedClient.clientSecret }
        : withoutSecret;
    return { ...config, authentication: { ...config.authentication, client: restored } };
}
async function wrapConflict(write) {
    try {
        return await write();
    }
    catch (error) {
        if ((0, db_1.isUniqueConstraintError)(error)) {
            throw new errors_1.ConflictError('A trusted source with this name or issuer already exists');
        }
        throw error;
    }
}
let TrustedSourceController = class TrustedSourceController {
    constructor(store, discovery, eventService) {
        this.store = store;
        this.discovery = discovery;
        this.eventService = eventService;
    }
    async list() {
        return (await this.store.listAll()).map(toSummary);
    }
    async get(_req, _res, id) {
        return redact(await this.require(id));
    }
    async create(req, _res, dto) {
        const { client } = dto.config.authentication;
        if (client?.kind === 'registered' && client.clientSecret === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE) {
            throw new errors_1.BadRequestError('clientSecret must be a real secret on create, not the blanking value');
        }
        const source = await wrapConflict(async () => await this.store.create(dto));
        this.eventService.emit('trusted-source-created', {
            user: req.user,
            sourceId: source.id,
            issuer: source.issuer,
        });
        return redact(source);
    }
    async update(req, _res, id, dto) {
        const current = await this.require(id);
        const { clearBindings = false, config, ...rest } = dto;
        if (rest.name === undefined &&
            rest.issuer === undefined &&
            config === undefined &&
            !clearBindings) {
            return redact(current);
        }
        await wrapConflict(async () => await this.store.update(id, { ...rest, ...(config && { config: restoreSecret(config, current.config) }) }, { clearBindings }));
        const updated = await this.require(id);
        this.eventService.emit('trusted-source-updated', {
            user: req.user,
            sourceId: updated.id,
            issuer: updated.issuer,
        });
        return redact(updated);
    }
    async delete(req, _res, id) {
        const source = await this.require(id);
        await this.store.delete(id);
        this.eventService.emit('trusted-source-deleted', {
            user: req.user,
            sourceId: source.id,
            issuer: source.issuer,
        });
    }
    async check(_req, _res, id) {
        await this.require(id);
        await this.discovery.refresh(id);
        return redact(await this.require(id));
    }
    async require(id) {
        const source = await this.store.getById(id);
        if (!source)
            throw new errors_1.NotFoundError(`Trusted source "${id}" not found`);
        return source;
    }
};
exports.TrustedSourceController = TrustedSourceController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('trustedSource:list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrustedSourceController.prototype, "list", null);
__decorate([
    (0, decorators_1.Get)('/:id'),
    (0, decorators_1.GlobalScope)('trustedSource:read'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TrustedSourceController.prototype, "get", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.Licensed)('feat:trustedSourceManage'),
    (0, decorators_1.GlobalScope)('trustedSource:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateTrustedSourceDto]),
    __metadata("design:returntype", Promise)
], TrustedSourceController.prototype, "create", null);
__decorate([
    (0, decorators_1.Patch)('/:id'),
    (0, decorators_1.Licensed)('feat:trustedSourceManage'),
    (0, decorators_1.GlobalScope)('trustedSource:update'),
    __param(2, (0, decorators_1.Param)('id')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateTrustedSourceDto]),
    __metadata("design:returntype", Promise)
], TrustedSourceController.prototype, "update", null);
__decorate([
    (0, decorators_1.Delete)('/:id'),
    (0, decorators_1.GlobalScope)('trustedSource:delete'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TrustedSourceController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Post)('/:id/check'),
    (0, decorators_1.GlobalScope)('trustedSource:update'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TrustedSourceController.prototype, "check", null);
exports.TrustedSourceController = TrustedSourceController = __decorate([
    (0, decorators_1.RestController)('/trusted-sources'),
    __metadata("design:paramtypes", [trusted_source_store_1.TrustedSourceDbStore, trusted_source_discovery_service_1.TrustedSourceDiscoveryService, backend_services_1.EventService])
], TrustedSourceController);
//# sourceMappingURL=trusted-source.controller.js.map