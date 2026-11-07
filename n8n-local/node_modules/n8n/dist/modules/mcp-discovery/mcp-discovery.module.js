"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpDiscoveryModule = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let McpDiscoveryModule = class McpDiscoveryModule {
    async init() {
        if (di_1.Container.get(config_1.GlobalConfig).deployment.type !== 'cloud')
            return;
        const { McpDiscoveryActivityEvents } = await import('./activity-events.service.js');
        di_1.Container.get(McpDiscoveryActivityEvents).init();
        await import('./mcp-discovery.controller.js');
    }
};
exports.McpDiscoveryModule = McpDiscoveryModule;
exports.McpDiscoveryModule = McpDiscoveryModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'mcp-discovery' })
], McpDiscoveryModule);
//# sourceMappingURL=mcp-discovery.module.js.map