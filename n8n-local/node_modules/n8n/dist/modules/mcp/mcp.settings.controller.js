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
exports.McpSettingsController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const middlewares_1 = require("../../middlewares");
const workflow_service_1 = require("../../workflows/workflow.service");
const update_allowed_redirect_uris_dto_1 = require("./dto/update-allowed-redirect-uris.dto");
const update_mcp_settings_dto_1 = require("./dto/update-mcp-settings.dto");
const update_workflows_availability_dto_1 = require("./dto/update-workflows-availability.dto");
const mcp_api_key_service_1 = require("./mcp-api-key.service");
const mcp_settings_service_1 = require("./mcp.settings.service");
let McpSettingsController = class McpSettingsController {
    constructor(mcpSettingsService, logger, moduleRegistry, mcpServerApiKeyService, workflowService, instanceSettingsLoaderConfig, eventService) {
        this.mcpSettingsService = mcpSettingsService;
        this.logger = logger;
        this.moduleRegistry = moduleRegistry;
        this.mcpServerApiKeyService = mcpServerApiKeyService;
        this.workflowService = workflowService;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
        this.eventService = eventService;
    }
    async updateSettings(req, _res, dto) {
        if (this.instanceSettingsLoaderConfig.mcpManagedByEnv) {
            throw new errors_1.ForbiddenError('MCP settings are managed via environment variables');
        }
        if (dto.mcpAccessEnabled !== undefined) {
            await this.mcpSettingsService.setEnabled(dto.mcpAccessEnabled);
            this.eventService.emit('mcp-access-updated', {
                user: req.user,
                enabled: dto.mcpAccessEnabled,
            });
        }
        if (dto.autoExposeNewWorkflows !== undefined) {
            await this.mcpSettingsService.setAutoExposeNewWorkflows(dto.autoExposeNewWorkflows);
        }
        await this.refreshMcpModuleSettings();
        const [mcpAccessEnabled, autoExposeNewWorkflows] = await Promise.all([
            this.mcpSettingsService.getEnabled(),
            this.mcpSettingsService.getAutoExposeNewWorkflows(),
        ]);
        return { mcpAccessEnabled, autoExposeNewWorkflows };
    }
    async getApiKeyForMcpServer(req) {
        return await this.mcpServerApiKeyService.getOrCreateApiKey(req.user);
    }
    async rotateApiKeyForMcpServer(req) {
        return await this.mcpServerApiKeyService.rotateMcpServerApiKey(req.user);
    }
    async getAllowedRedirectUris() {
        const uris = await this.mcpSettingsService.getAllowedRedirectUris();
        return { uris };
    }
    async updateAllowedRedirectUris(_req, _res, dto) {
        await this.mcpSettingsService.setAllowedRedirectUris(dto.uris);
        return { success: true };
    }
    async getMcpEligibleWorkflows(req, res) {
        const options = {
            ...req.listQueryOptions,
            filter: {
                ...req.listQueryOptions?.filter,
                isArchived: false,
                availableInMCP: false,
            },
        };
        const { workflows, count } = await this.workflowService.getMany(req.user, options, {
            requiredScopes: ['workflow:update'],
        });
        res.json({ count, data: workflows });
    }
    async toggleWorkflowsMCPAccess(req, _res, dto) {
        const { changedWorkflows, ...result } = await this.mcpSettingsService.bulkSetAvailableInMCP(req.user, dto);
        void this.mcpSettingsService.broadcastWorkflowMCPAvailabilityChanged(changedWorkflows);
        return result;
    }
    async refreshMcpModuleSettings() {
        try {
            await this.moduleRegistry.refreshModuleSettings('mcp');
        }
        catch (error) {
            this.logger.warn('Failed to sync MCP settings to module registry', {
                cause: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.McpSettingsController = McpSettingsController;
__decorate([
    (0, decorators_1.GlobalScope)('mcp:manage'),
    (0, decorators_1.Patch)('/settings'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, update_mcp_settings_dto_1.UpdateMcpSettingsDto]),
    __metadata("design:returntype", Promise)
], McpSettingsController.prototype, "updateSettings", null);
__decorate([
    (0, decorators_1.GlobalScope)('mcpApiKey:create'),
    (0, decorators_1.Get)('/api-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], McpSettingsController.prototype, "getApiKeyForMcpServer", null);
__decorate([
    (0, decorators_1.GlobalScope)('mcpApiKey:rotate'),
    (0, decorators_1.Post)('/api-key/rotate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], McpSettingsController.prototype, "rotateApiKeyForMcpServer", null);
__decorate([
    (0, decorators_1.GlobalScope)('mcp:manage'),
    (0, decorators_1.Get)('/oauth/allowed-redirect-uris'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], McpSettingsController.prototype, "getAllowedRedirectUris", null);
__decorate([
    (0, decorators_1.GlobalScope)('mcp:manage'),
    (0, decorators_1.Patch)('/oauth/allowed-redirect-uris'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, update_allowed_redirect_uris_dto_1.UpdateAllowedRedirectUrisDto]),
    __metadata("design:returntype", Promise)
], McpSettingsController.prototype, "updateAllowedRedirectUris", null);
__decorate([
    (0, decorators_1.Get)('/workflows', { middlewares: middlewares_1.listQueryMiddleware }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpSettingsController.prototype, "getMcpEligibleWorkflows", null);
__decorate([
    (0, decorators_1.Patch)('/workflows/toggle-access'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, update_workflows_availability_dto_1.UpdateWorkflowsAvailabilityDto]),
    __metadata("design:returntype", Promise)
], McpSettingsController.prototype, "toggleWorkflowsMCPAccess", null);
exports.McpSettingsController = McpSettingsController = __decorate([
    (0, decorators_1.RestController)('/mcp'),
    __metadata("design:paramtypes", [mcp_settings_service_1.McpSettingsService, backend_common_1.Logger, backend_common_1.ModuleRegistry, mcp_api_key_service_1.McpServerApiKeyService, workflow_service_1.WorkflowService, config_1.InstanceSettingsLoaderConfig, backend_services_1.EventService])
], McpSettingsController);
//# sourceMappingURL=mcp.settings.controller.js.map