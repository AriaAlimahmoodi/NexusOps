import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { SettingsRepository } from '@n8n/db';
export declare class SamlInstanceSettingsLoader {
    private readonly config;
    private readonly settingsRepository;
    private logger;
    constructor(config: InstanceSettingsLoaderConfig, settingsRepository: SettingsRepository, logger: Logger);
    apply(): Promise<void>;
    private writePreferences;
    private writeLoginDisabled;
}
