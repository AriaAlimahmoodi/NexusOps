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
exports.McpRegistryController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const mcp_connection_discovery_service_1 = require("./mcp-connection-discovery.service");
const mcp_registry_response_1 = require("./mcp-registry-response");
const mcp_registry_service_1 = require("./registry/mcp-registry.service");
let McpRegistryController = class McpRegistryController {
    constructor(service, discoveryService) {
        this.service = service;
        this.discoveryService = discoveryService;
    }
    async listServers() {
        const servers = await this.service.getAll({ includeDeprecated: false });
        return servers.flatMap((server) => {
            const response = (0, mcp_registry_response_1.toMcpRegistryServerResponse)(server);
            return response ? [response] : [];
        });
    }
    async discover(req) {
        const payload = api_types_1.mcpRegistryDiscoveryRequestSchema.safeParse(req.body);
        if (!payload.success)
            throw new errors_1.BadRequestError('Invalid MCP discovery request');
        return await this.discoveryService.discover(req.user, payload.data);
    }
};
exports.McpRegistryController = McpRegistryController;
__decorate([
    (0, decorators_1.Get)('/servers'),
    (0, decorators_1.GlobalScope)('mcp:oauth'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], McpRegistryController.prototype, "listServers", null);
__decorate([
    (0, decorators_1.Post)('/discover'),
    (0, decorators_1.GlobalScope)('mcp:oauth'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], McpRegistryController.prototype, "discover", null);
exports.McpRegistryController = McpRegistryController = __decorate([
    (0, decorators_1.RestController)('/mcp-registry'),
    __metadata("design:paramtypes", [mcp_registry_service_1.McpRegistryService, mcp_connection_discovery_service_1.McpConnectionDiscoveryService])
], McpRegistryController);
//# sourceMappingURL=mcp-registry.controller.js.map