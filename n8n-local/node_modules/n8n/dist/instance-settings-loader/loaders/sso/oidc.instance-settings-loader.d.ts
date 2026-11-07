import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { SettingsRepository } from '@n8n/db';
import { Cipher } from 'n8n-core';
export declare class OidcInstanceSettingsLoader {
    private readonly config;
    private readonly settingsRepository;
    private readonly cipher;
    private logger;
    constructor(config: InstanceSettingsLoaderConfig, settingsRepository: SettingsRepository, cipher: Cipher, logger: Logger);
    apply(): Promise<void>;
    private writePreferences;
    private writeLoginDisabled;
}
