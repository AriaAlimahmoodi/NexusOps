"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpRegistryModule = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const constants_1 = require("../../constants");
const load_nodes_and_credentials_1 = require("../../load-nodes-and-credentials");
let McpRegistryModule = class McpRegistryModule {
    async init() {
        const { McpRegistryService } = await import('./registry/mcp-registry.service.js');
        await di_1.Container.get(McpRegistryService).init();
        await import('./mcp-registry.controller.js');
        if (constants_1.inE2ETests) {
            await import('./mcp-registry-test.controller.js');
        }
    }
    async systemTasks() {
        if (constants_1.inE2ETests) {
            return [];
        }
        const { McpRegistryRefreshTask } = await import('./mcp-registry-refresh.task.js');
        return [McpRegistryRefreshTask];
    }
    async entities() {
        const { McpRegistryServerEntity } = await import('./registry/mcp-registry-server.entity.js');
        return [McpRegistryServerEntity];
    }
    async nodeLoaders() {
        const { McpRegistryNodeLoader } = await import('./mcp-registry-node-loader.js');
        return [
            new McpRegistryNodeLoader(di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials), di_1.Container.get(backend_common_1.Logger)),
        ];
    }
};
exports.McpRegistryModule = McpRegistryModule;
exports.McpRegistryModule = McpRegistryModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'mcp-registry' })
], McpRegistryModule);
//# sourceMappingURL=mcp-registry.module.js.map