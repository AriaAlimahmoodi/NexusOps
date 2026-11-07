import { SettingsRepository } from '@n8n/db';
import { CacheService } from '@n8n/backend-services';
export declare class ScimSettingsService {
    private readonly settingsRepository;
    private readonly cacheService;
    constructor(settingsRepository: SettingsRepository, cacheService: CacheService);
    isEnabled(): Promise<boolean>;
    setEnabled(enabled: boolean): Promise<void>;
}
