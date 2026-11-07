import { GlobalConfig } from '@n8n/config';
import { SettingsRepository } from '@n8n/db';
import { CacheService } from '@n8n/backend-services';
export declare class AiUsageService {
    private readonly settingsRepository;
    private readonly cacheService;
    private readonly globalConfig;
    constructor(settingsRepository: SettingsRepository, cacheService: CacheService, globalConfig: GlobalConfig);
    isParameterValueSharingAllowed(): Promise<boolean>;
    getAiUsageSettings(): Promise<boolean>;
    updateAiUsageSettings(allowSendingActualData: boolean): Promise<void>;
}
