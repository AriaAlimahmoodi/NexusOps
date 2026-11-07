import { Logger } from '@n8n/backend-common';
import { SettingsRepository } from '@n8n/db';
import { OtelConfig } from './otel.config';
export declare const OTEL_SETTINGS_KEY = "features.otel";
export type OtelSettingsResponse = OtelConfig & {
    envManagedFields: Array<keyof OtelConfig>;
};
export type OtelConnectionParams = Pick<OtelConfig, 'exporterProtocol' | 'exporterEndpoint' | 'exporterTracingPath' | 'exporterServiceName' | 'exporterHeaders' | 'startupConnectivityTimeoutMs'>;
export declare class OtelSettingsService {
    private readonly config;
    private readonly settingsRepository;
    private readonly logger;
    private currentSettings;
    private envManagedFields;
    constructor(config: OtelConfig, settingsRepository: SettingsRepository, logger: Logger);
    getSettings(): OtelSettingsResponse;
    loadSettings(): Promise<OtelConfig>;
    private getPersistedSettings;
    private parsePersisted;
    saveSettings(incoming: OtelConfig): Promise<void>;
    resolveTestConnection(incoming: OtelConnectionParams): OtelConnectionParams;
    private redactHeaders;
    private resolveHeaders;
    private parseHeaderPairs;
    private serializeHeaderPairs;
    private isEnvManaged;
    private buildConfig;
}
