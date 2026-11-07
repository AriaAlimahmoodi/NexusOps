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
exports.McpRegistryTestController = void 0;
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const mcp_registry_server_entity_1 = require("./registry/mcp-registry-server.entity");
const mcp_registry_server_repository_1 = require("./registry/mcp-registry-server.repository");
const mcp_registry_service_1 = require("./registry/mcp-registry.service");
const mcp_registry_types_1 = require("./registry/mcp-registry.types");
const mock_servers_1 = require("./registry/mock-servers");
let McpRegistryTestController = class McpRegistryTestController {
    constructor(repository, service) {
        this.repository = repository;
        this.service = service;
    }
    async seed() {
        this.assertE2ETestsEnabled();
        const entities = [mock_servers_1.notionMockServer, mock_servers_1.linearMockServer].map(mcp_registry_types_1.toEntity);
        await this.repository.manager.transaction(async (manager) => {
            await manager.createQueryBuilder().delete().from(mcp_registry_server_entity_1.McpRegistryServerEntity).execute();
            await manager.insert(mcp_registry_server_entity_1.McpRegistryServerEntity, entities);
        });
        await this.service.handleReloadMcpRegistry();
        return { ok: true, count: entities.length };
    }
    assertE2ETestsEnabled() {
        if (process.env.E2E_TESTS !== 'true') {
            throw new errors_1.ForbiddenError('MCP registry test endpoints are not enabled');
        }
    }
};
exports.McpRegistryTestController = McpRegistryTestController;
__decorate([
    (0, decorators_1.Post)('/test/seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], McpRegistryTestController.prototype, "seed", null);
exports.McpRegistryTestController = McpRegistryTestController = __decorate([
    (0, decorators_1.RestController)('/mcp-registry'),
    __metadata("design:paramtypes", [mcp_registry_server_repository_1.McpRegistryServerRepository, mcp_registry_service_1.McpRegistryService])
], McpRegistryTestController);
//# sourceMappingURL=mcp-registry-test.controller.js.map