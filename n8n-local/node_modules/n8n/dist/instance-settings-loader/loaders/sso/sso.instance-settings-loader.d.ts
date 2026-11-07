import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { OidcInstanceSettingsLoader } from './oidc.instance-settings-loader';
import { ProvisioningInstanceSettingsLoader } from './provisioning.instance-settings-loader';
import { SamlInstanceSettingsLoader } from './saml.instance-settings-loader';
export declare class SsoInstanceSettingsLoader {
    private readonly config;
    private readonly samlLoader;
    private readonly oidcLoader;
    private readonly provisioningLoader;
    private logger;
    constructor(config: InstanceSettingsLoaderConfig, samlLoader: SamlInstanceSettingsLoader, oidcLoader: OidcInstanceSettingsLoader, provisioningLoader: ProvisioningInstanceSettingsLoader, logger: Logger);
    run(): Promise<'created' | 'skipped'>;
    private syncAuthMethod;
}
