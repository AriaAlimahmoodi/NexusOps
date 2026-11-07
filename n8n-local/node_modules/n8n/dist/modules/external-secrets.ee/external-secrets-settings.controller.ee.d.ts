import { UpdateExternalSecretsSettingsDto } from '@n8n/api-types';
import { ModuleRegistry, Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import { ExternalSecretsSettingsService } from './external-secrets-settings.service.ee';
import { ExternalSecretsConfig } from './external-secrets.config';
export declare class ExternalSecretsSettingsController {
    private readonly config;
    private readonly settingsService;
    private readonly moduleRegistry;
    private readonly logger;
    private readonly eventService;
    constructor(config: ExternalSecretsConfig, settingsService: ExternalSecretsSettingsService, moduleRegistry: ModuleRegistry, logger: Logger, eventService: EventService);
    checkFeatureFlag(_req: Request, res: Response, next: NextFunction): void;
    updateSettings(req: AuthenticatedRequest, _res: Response, body: UpdateExternalSecretsSettingsDto): Promise<{
        systemRolesEnabled: boolean;
    }>;
}
