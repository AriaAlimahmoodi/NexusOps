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
exports.McpSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const mcp_settings_service_1 = require("../../modules/mcp/mcp.settings.service");
let McpSettingsLoader = class McpSettingsLoader {
    constructor(instanceSettingsLoaderConfig, mcpSettingsService, logger) {
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
        this.mcpSettingsService = mcpSettingsService;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async run() {
        const { mcpManagedByEnv, mcpAccessEnabled } = this.instanceSettingsLoaderConfig;
        if (!mcpManagedByEnv) {
            this.logger.debug('mcpManagedByEnv is disabled — skipping MCP env vars');
            return 'skipped';
        }
        this.logger.info('mcpManagedByEnv is enabled — applying MCP env vars');
        await this.mcpSettingsService.setEnabled(mcpAccessEnabled);
        return 'created';
    }
};
exports.McpSettingsLoader = McpSettingsLoader;
exports.McpSettingsLoader = McpSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, mcp_settings_service_1.McpSettingsService, backend_common_1.Logger])
], McpSettingsLoader);
//# sourceMappingURL=mcp-settings.loader.js.map