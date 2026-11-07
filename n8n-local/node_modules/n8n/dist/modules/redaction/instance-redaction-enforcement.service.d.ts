import { type RedactionFloor } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { SettingsRepository } from '@n8n/db';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { CacheService } from '@n8n/backend-services';
export declare class InstanceRedactionEnforcementService {
    private readonly settingsRepository;
    private readonly cacheService;
    private readonly logger;
    private readonly publisher;
    private readonly globalConfig;
    constructor(settingsRepository: SettingsRepository, cacheService: CacheService, logger: Logger, publisher: Publisher, globalConfig: GlobalConfig);
    get(): Promise<RedactionFloor>;
    private load;
    set(next: RedactionFloor): Promise<void>;
    handleRedactionFloorChanged(): Promise<void>;
    private loadFromDatabase;
    private parseStoredValue;
}
