import { Logger } from '@n8n/backend-common';
import { CommunityPackagesInstanceSettingsLoader } from './loaders/community-packages.instance-settings-loader';
import { LogStreamingInstanceSettingsLoader } from './loaders/log-streaming.instance-settings-loader';
import { McpSettingsLoader } from './loaders/mcp-settings.loader';
import { OwnerInstanceSettingsLoader } from './loaders/owner.instance-settings-loader';
import { SecurityPolicyInstanceSettingsLoader } from './loaders/security-policy.instance-settings-loader';
import { SsoInstanceSettingsLoader } from './loaders/sso/sso.instance-settings-loader';
export declare class InstanceSettingsLoaderService {
    private logger;
    private readonly ownerLoader;
    private readonly ssoLoader;
    private readonly securityPolicyLoader;
    private readonly logStreamingLoader;
    private readonly mcpLoader;
    private readonly communityPackagesLoader;
    constructor(logger: Logger, ownerLoader: OwnerInstanceSettingsLoader, ssoLoader: SsoInstanceSettingsLoader, securityPolicyLoader: SecurityPolicyInstanceSettingsLoader, logStreamingLoader: LogStreamingInstanceSettingsLoader, mcpLoader: McpSettingsLoader, communityPackagesLoader: CommunityPackagesInstanceSettingsLoader);
    init(): Promise<void>;
    private run;
}
