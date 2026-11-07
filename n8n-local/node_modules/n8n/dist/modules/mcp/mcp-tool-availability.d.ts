import type { ModuleRegistry } from '@n8n/backend-common';
import type { GlobalConfig } from '@n8n/config';
import { type AuthPrincipal } from '@n8n/permissions';
import type { FeatureFlags } from 'n8n-workflow';
import type { CommunityPackagesConfig } from '../../modules/community-packages/community-packages.config';
import type { McpConfig } from './mcp.config';
export declare function arePreferenceToolsEnabled(flags: FeatureFlags): boolean;
export declare function areAgentToolsAvailable(globalConfig: GlobalConfig, moduleRegistry: ModuleRegistry): boolean;
export declare function areSkillToolsAvailable(globalConfig: GlobalConfig, moduleRegistry: ModuleRegistry): boolean;
export declare function isCommunityNodeInstallAvailable(moduleRegistry: ModuleRegistry, config: Pick<CommunityPackagesConfig, 'enabled' | 'verifiedEnabled'>, globalConfig: {
    endpoints: Pick<GlobalConfig['endpoints'], 'mcpBuilderEnabled'>;
    instanceSettingsLoader: Pick<GlobalConfig['instanceSettingsLoader'], 'communityPackagesManagedByEnv'>;
}, mcpConfig: Pick<McpConfig, 'communityNodeDiscoveryEnabled'>, user: AuthPrincipal): boolean;
