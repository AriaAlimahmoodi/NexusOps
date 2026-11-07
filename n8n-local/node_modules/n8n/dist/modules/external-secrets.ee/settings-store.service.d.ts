import { SettingsRepository } from '@n8n/db';
import { Cipher } from 'n8n-core';
import type { ExternalSecretsSettings, SecretsProviderSettings } from './types';
export declare class ExternalSecretsSettingsStore {
    private readonly settingsRepo;
    private readonly cipher;
    private cache;
    constructor(settingsRepo: SettingsRepository, cipher: Cipher);
    load(): Promise<ExternalSecretsSettings>;
    reload(): Promise<ExternalSecretsSettings>;
    getCached(): ExternalSecretsSettings;
    save(settings: ExternalSecretsSettings): Promise<void>;
    updateProvider(providerName: string, partialSettings: Partial<SecretsProviderSettings>): Promise<{
        settings: ExternalSecretsSettings;
        isNewProvider: boolean;
    }>;
    getProvider(providerName: string): Promise<SecretsProviderSettings | undefined>;
    removeProvider(providerName: string): Promise<void>;
    private decrypt;
    private encrypt;
}
