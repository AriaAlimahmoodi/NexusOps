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
exports.McpProtectedResource = exports.SUPPORTED_SCOPES = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const posthog_1 = require("../../posthog");
const mcp_scopes_1 = require("./mcp-scopes");
const mcp_tool_availability_1 = require("./mcp-tool-availability");
const mcp_config_1 = require("./mcp.config");
const mcp_settings_service_1 = require("./mcp.settings.service");
exports.SUPPORTED_SCOPES = [...api_types_1.MCP_INSTANCE_SCOPES];
const AGENT_SCOPES = new Set(api_types_1.MCP_AGENT_SCOPES);
const SKILL_SCOPES = new Set(api_types_1.MCP_SKILL_SCOPES);
const PREFERENCE_SCOPES = new Set(['aiPreference:read', 'aiPreference:write']);
const MCP_RESOURCE_PATH = '/mcp-server/http';
const LEGACY_MCP_AUDIENCE = 'mcp-server-api';
let McpProtectedResource = class McpProtectedResource {
    constructor(urlService, mcpSettingsService, mcpConfig, globalConfig, moduleRegistry, licenseState, postHogClient) {
        this.urlService = urlService;
        this.mcpSettingsService = mcpSettingsService;
        this.mcpConfig = mcpConfig;
        this.globalConfig = globalConfig;
        this.moduleRegistry = moduleRegistry;
        this.licenseState = licenseState;
        this.postHogClient = postHogClient;
        this.id = constants_1.INSTANCE_MCP_RESOURCE_ID;
        this.surface = 'instance-mcp';
        this.isDefault = true;
    }
    get scopes() {
        const agentsAvailable = (0, mcp_tool_availability_1.areAgentToolsAvailable)(this.globalConfig, this.moduleRegistry);
        const skillsAvailable = (0, mcp_tool_availability_1.areSkillToolsAvailable)(this.globalConfig, this.moduleRegistry);
        return exports.SUPPORTED_SCOPES.filter((scope) => (agentsAvailable || !AGENT_SCOPES.has(scope)) &&
            (skillsAvailable || !SKILL_SCOPES.has(scope)));
    }
    async getScopeTools() {
        const builderEnabled = this.globalConfig.endpoints.mcpBuilderEnabled;
        const tagsDisabled = this.globalConfig.tags.disabled;
        const foldersLicensed = this.licenseState.isFoldersLicensed();
        const supportedScopes = new Set(this.scopes);
        const instanceContextAvailable = this.moduleRegistry.isActive('instance-ai');
        let instanceContextEnabled = false;
        try {
            instanceContextEnabled =
                (await this.postHogClient.getFeatureFlagForInstance(api_types_1.INSTANCE_ACTIVITY_CONTEXT_FLAG)) ===
                    true;
        }
        catch {
        }
        return Object.fromEntries(Object.entries(mcp_scopes_1.TOOLS_BY_SCOPE)
            .filter(([scope]) => supportedScopes.has(scope))
            .map(([scope, tools]) => [
            scope,
            tools.filter((tool) => (builderEnabled || !mcp_scopes_1.BUILDER_TOOLS.has(tool)) &&
                (!tagsDisabled || tool !== 'list_workflow_tags') &&
                (foldersLicensed || !mcp_scopes_1.FOLDER_FEATURE_TOOLS.has(tool)) &&
                (instanceContextAvailable || !mcp_scopes_1.ACTIVITY_LOG_TOOLS.has(tool)) &&
                (instanceContextEnabled || !mcp_scopes_1.INSTANCE_CONTEXT_TOOLS.has(tool))),
        ]));
    }
    getResourceUrl() {
        if (this.mcpConfig.baseUrl) {
            return `${this.mcpConfig.baseUrl}${MCP_RESOURCE_PATH}`;
        }
        const baseUrl = this.urlService.getInstanceBaseUrl().replace(/\/$/, '');
        return `${baseUrl}${MCP_RESOURCE_PATH}`;
    }
    getProtectedResourceMetadataUrl() {
        const url = new URL(this.getResourceUrl());
        return `${url.origin}/.well-known/oauth-protected-resource${url.pathname}`;
    }
    getResourceUrls() {
        const instanceUrl = `${this.urlService.getInstanceBaseUrl().replace(/\/$/, '')}${MCP_RESOURCE_PATH}`;
        return [...new Set([this.getResourceUrl(), instanceUrl])];
    }
    getAudiences() {
        return [...this.getResourceUrls(), LEGACY_MCP_AUDIENCE];
    }
    async getAllowedRedirectUris() {
        return await this.mcpSettingsService.getAllowedRedirectUris();
    }
    async getGrantableScopes(user) {
        const { CommunityPackagesConfig } = await import('../../modules/community-packages/community-packages.config.js');
        const installAvailable = (0, mcp_tool_availability_1.isCommunityNodeInstallAvailable)(this.moduleRegistry, di_1.Container.get(CommunityPackagesConfig), this.globalConfig, this.mcpConfig, user);
        const preferencesEnabled = await this.arePreferencesEnabledFor(user);
        return this.scopes.filter((scope) => (installAvailable || scope !== 'communityPackage:install') &&
            (preferencesEnabled || !PREFERENCE_SCOPES.has(scope)));
    }
    async arePreferencesEnabledFor(user) {
        try {
            return (0, mcp_tool_availability_1.arePreferenceToolsEnabled)(await this.postHogClient.getFeatureFlags(user));
        }
        catch {
            return false;
        }
    }
    async isAvailable() {
        return await this.mcpSettingsService.getEnabled();
    }
    async authorize(_user) {
        return await this.isAvailable();
    }
};
exports.McpProtectedResource = McpProtectedResource;
exports.McpProtectedResource = McpProtectedResource = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.UrlService, mcp_settings_service_1.McpSettingsService, mcp_config_1.McpConfig, config_1.GlobalConfig, backend_common_1.ModuleRegistry, backend_common_1.LicenseState, posthog_1.PostHogClient])
], McpProtectedResource);
//# sourceMappingURL=mcp-protected-resource.js.map