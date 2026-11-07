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
exports.McpDiscoveryActivityService = exports.discoveryUserKey = exports.isClaudeMcpClient = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const isClaudeMcpClient = (name) => Boolean(name && ((0, api_types_1.getMcpClientBrand)(name) === 'claude' || name.toLowerCase() === 'anthropic/toolbox'));
exports.isClaudeMcpClient = isClaudeMcpClient;
const discoveryUserKey = (userId, field) => `experiment.mcpDiscovery.${userId}.${field}`;
exports.discoveryUserKey = discoveryUserKey;
const connectionField = (caller) => caller?.authType === 'oauth'
    ? `claudeClient.${caller.clientId}`
    : caller?.apiKeyId
        ? `claudeApiKey.${caller.apiKeyId}`
        : undefined;
let McpDiscoveryActivityService = class McpDiscoveryActivityService {
    constructor(settings, config, logger) {
        this.settings = settings;
        this.config = config;
        this.logger = logger;
    }
    async recordClaudeConnection(userId, clientName, caller) {
        if (this.config.deployment.type !== 'cloud' || !(0, exports.isClaudeMcpClient)(clientName))
            return;
        const field = connectionField(caller);
        if (!field)
            return;
        await this.settings.claimKey((0, exports.discoveryUserKey)(userId, field), String(Date.now()));
    }
    async recordFirstLogin(userId, loggedInAt) {
        if (this.config.deployment.type !== 'cloud')
            return;
        await this.settings.claimKey((0, exports.discoveryUserKey)(userId, 'firstLoginAt'), String(loggedInAt));
    }
    async recordMcpToolResult(userId, toolName, status, workflowId, appliedOperations) {
        if (this.config.deployment.type !== 'cloud' || status !== 'success')
            return;
        if (!workflowId || !['create_workflow_from_code', 'update_workflow'].includes(toolName))
            return;
        if (toolName === 'update_workflow' && appliedOperations === 0)
            return;
        await this.settings.claimKey((0, exports.discoveryUserKey)(userId, 'claudeMcpUsedAt'), String(Date.now()));
    }
    async recordAssistantMutation(userId, changedAt = Date.now()) {
        if (this.config.deployment.type !== 'cloud')
            return;
        try {
            await this.settings.claimKey((0, exports.discoveryUserKey)(userId, 'assistantMutationAt'), String(changedAt));
        }
        catch (error) {
            this.logger.warn('Failed to record MCP discovery Assistant activity', { error });
        }
    }
};
exports.McpDiscoveryActivityService = McpDiscoveryActivityService;
exports.McpDiscoveryActivityService = McpDiscoveryActivityService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, config_1.GlobalConfig, backend_common_1.Logger])
], McpDiscoveryActivityService);
//# sourceMappingURL=activity.service.js.map