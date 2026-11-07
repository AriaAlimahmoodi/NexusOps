import { Logger } from '@n8n/backend-common';
import { GlobalConfig, InstanceSettingsLoaderConfig } from '@n8n/config';
import { SettingsRepository } from '@n8n/db';
export declare class ProvisioningInstanceSettingsLoader {
    private readonly config;
    private readonly globalConfig;
    private readonly settingsRepository;
    private logger;
    constructor(config: InstanceSettingsLoaderConfig, globalConfig: GlobalConfig, settingsRepository: SettingsRepository, logger: Logger);
    apply(): Promise<void>;
}
