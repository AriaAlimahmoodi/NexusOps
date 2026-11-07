"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arePreferenceToolsEnabled = arePreferenceToolsEnabled;
exports.areAgentToolsAvailable = areAgentToolsAvailable;
exports.areSkillToolsAvailable = areSkillToolsAvailable;
exports.isCommunityNodeInstallAvailable = isCommunityNodeInstallAvailable;
const api_types_1 = require("@n8n/api-types");
const permissions_1 = require("@n8n/permissions");
function arePreferenceToolsEnabled(flags) {
    return flags[api_types_1.CONTEXT_PREFERENCES_FLAG] === api_types_1.CONTEXT_PREFERENCES_ENABLED_VARIANT;
}
function areAgentToolsAvailable(globalConfig, moduleRegistry) {
    return (globalConfig.endpoints.mcpBuilderEnabled &&
        moduleRegistry.isActive('agents') &&
        moduleRegistry.settings.get('agents')?.enabled !== false);
}
function areSkillToolsAvailable(globalConfig, moduleRegistry) {
    return moduleRegistry.isActive('agents') && globalConfig.agents.skillsHubEnabled;
}
function isCommunityNodeInstallAvailable(moduleRegistry, config, globalConfig, mcpConfig, user) {
    return (globalConfig.endpoints.mcpBuilderEnabled &&
        mcpConfig.communityNodeDiscoveryEnabled &&
        moduleRegistry.isActive('community-packages') &&
        config.enabled &&
        config.verifiedEnabled &&
        !globalConfig.instanceSettingsLoader.communityPackagesManagedByEnv &&
        (0, permissions_1.hasGlobalScope)(user, 'communityPackage:install'));
}
//# sourceMappingURL=mcp-tool-availability.js.map