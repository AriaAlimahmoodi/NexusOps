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
exports.InstanceAiMcpConnectionController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const backend_services_1 = require("@n8n/backend-services");
const errors_1 = require("@n8n/errors");
const mcp_registry_service_1 = require("../../../modules/mcp-registry/registry/mcp-registry.service");
const instance_ai_mcp_registry_service_1 = require("./instance-ai-mcp-registry.service");
function serverMetadata(server, slug) {
    if (!server)
        return { title: slug, icons: [] };
    return { title: server.title, icons: server.icons };
}
let InstanceAiMcpConnectionController = class InstanceAiMcpConnectionController {
    constructor(service, credentialsFinderService, mcpRegistryService) {
        this.service = service;
        this.credentialsFinderService = credentialsFinderService;
        this.mcpRegistryService = mcpRegistryService;
    }
    async list(req) {
        const connections = await this.service.listConnectionsForUser(req.user);
        if (connections.length === 0)
            return [];
        const [accessibleCredentials, servers] = await Promise.all([
            this.credentialsFinderService.findCredentialsForUser(req.user, ['credential:read']),
            this.mcpRegistryService.getBySlugs([...new Set(connections.map((c) => c.serverSlug))]),
        ]);
        const credentialById = new Map(accessibleCredentials.map((c) => [c.id, c]));
        const serverBySlug = new Map(servers.map((server) => [server.slug, server]));
        const enriched = [];
        for (const connection of connections) {
            const credential = credentialById.get(connection.credentialId);
            if (!credential)
                continue;
            enriched.push(toResponse(connection, credential.name, credential.type, serverMetadata(serverBySlug.get(connection.serverSlug), connection.serverSlug)));
        }
        return enriched;
    }
    async create(req, _res, payload) {
        const { connection, credential, server } = await this.service.createConnection(req.user, payload);
        return toResponse(connection, credential.name, credential.type, serverMetadata(server, connection.serverSlug));
    }
    async listAllTools(req) {
        return await this.service.listAllConnectionTools(req.user);
    }
    async listTools(req, _res, id) {
        return await this.service.listConnectionTools(req.user, id);
    }
    async update(req, _res, id, payload) {
        const connection = await this.service.updateConnection(req.user, id, payload);
        const credential = await this.credentialsFinderService.findCredentialForUser(connection.credentialId, req.user, ['credential:read']);
        if (!credential) {
            throw new errors_1.NotFoundError('Credential not found for connection');
        }
        const server = await this.mcpRegistryService.get(connection.serverSlug);
        return toResponse(connection, credential.name, credential.type, serverMetadata(server, connection.serverSlug));
    }
    async delete(req, _res, id) {
        await this.service.deleteConnection(req.user, id);
    }
};
exports.InstanceAiMcpConnectionController = InstanceAiMcpConnectionController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiMcpConnectionController.prototype, "list", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstanceAiMcpCreateConnectionRequestDto]),
    __metadata("design:returntype", Promise)
], InstanceAiMcpConnectionController.prototype, "create", null);
__decorate([
    (0, decorators_1.Get)('/tools'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiMcpConnectionController.prototype, "listAllTools", null);
__decorate([
    (0, decorators_1.Get)('/:id/tools'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiMcpConnectionController.prototype, "listTools", null);
__decorate([
    (0, decorators_1.Patch)('/:id'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('id')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.InstanceAiMcpUpdateConnectionRequestDto]),
    __metadata("design:returntype", Promise)
], InstanceAiMcpConnectionController.prototype, "update", null);
__decorate([
    (0, decorators_1.Delete)('/:id'),
    (0, decorators_1.GlobalScope)('instanceAi:message'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InstanceAiMcpConnectionController.prototype, "delete", null);
exports.InstanceAiMcpConnectionController = InstanceAiMcpConnectionController = __decorate([
    (0, decorators_1.RestController)('/instance-ai/mcp/connections'),
    __metadata("design:paramtypes", [instance_ai_mcp_registry_service_1.InstanceAiMcpRegistryService, backend_services_1.CredentialsFinderService, mcp_registry_service_1.McpRegistryService])
], InstanceAiMcpConnectionController);
function toResponse(connection, credentialName, credentialType, server) {
    return {
        id: connection.id,
        serverSlug: connection.serverSlug,
        serverTitle: server.title,
        serverIcons: server.icons,
        credentialId: connection.credentialId,
        credentialName,
        credentialType,
        toolPermissions: connection.toolPermissions,
        createdAt: connection.createdAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
    };
}
//# sourceMappingURL=instance-ai-mcp-connection.controller.js.map