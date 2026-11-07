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
exports.McpModule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let McpModule = class McpModule {
    async init() {
        await import('./mcp.controller.js');
        await import('./mcp.settings.controller.js');
        const { ProtectedResourceRegistry } = await import('@n8n/backend-services/auth');
        const { McpProtectedResource } = await import('./mcp-protected-resource.js');
        di_1.Container.get(ProtectedResourceRegistry).register(di_1.Container.get(McpProtectedResource));
    }
    async settings() {
        const { McpSettingsService } = await import('./mcp.settings.service.js');
        const { McpProtectedResource } = await import('./mcp-protected-resource.js');
        const mcpSettingsService = di_1.Container.get(McpSettingsService);
        const mcpAccessEnabled = await mcpSettingsService.getEnabled();
        const autoExposeNewWorkflows = await mcpSettingsService.getAutoExposeNewWorkflows();
        const { mcpManagedByEnv } = di_1.Container.get(config_1.InstanceSettingsLoaderConfig);
        const serverUrl = di_1.Container.get(McpProtectedResource).getResourceUrl();
        return { mcpAccessEnabled, mcpManagedByEnv, serverUrl, autoExposeNewWorkflows };
    }
    async shutdown() { }
};
exports.McpModule = McpModule;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], McpModule.prototype, "shutdown", null);
exports.McpModule = McpModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'mcp', instanceTypes: ['main'] })
], McpModule);
//# sourceMappingURL=mcp.module.js.map