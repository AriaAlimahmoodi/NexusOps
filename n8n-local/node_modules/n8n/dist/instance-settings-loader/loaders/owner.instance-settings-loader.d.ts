import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { OwnershipService } from '../../services/ownership.service';
export declare class OwnerInstanceSettingsLoader {
    private readonly instanceSettingsLoaderConfig;
    private readonly ownershipService;
    private logger;
    constructor(instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig, ownershipService: OwnershipService, logger: Logger);
    run(): Promise<'created' | 'skipped'>;
}
