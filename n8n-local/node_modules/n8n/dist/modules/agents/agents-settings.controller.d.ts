import { AgentsSettingsDto } from '@n8n/api-types';
import { Logger, ModuleRegistry } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { AgentsSettingsService } from './agents-settings.service';
export declare class AgentsSettingsController {
    private readonly settingsService;
    private readonly moduleRegistry;
    private readonly publisher;
    private readonly logger;
    constructor(settingsService: AgentsSettingsService, moduleRegistry: ModuleRegistry, publisher: Publisher, logger: Logger);
    getSettings(): Promise<AgentsSettingsDto>;
    updateSettings(_req: AuthenticatedRequest, _res: Response, settings: AgentsSettingsDto): Promise<AgentsSettingsDto>;
    reloadSettings(): Promise<void>;
}
