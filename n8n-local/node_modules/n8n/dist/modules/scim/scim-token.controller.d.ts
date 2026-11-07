import { ScimConfigPatchDto } from '@n8n/api-types';
import { Logger, ModuleRegistry } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { ScimSettingsService } from './scim-settings.service';
import { ScimTokenService } from './scim-token.service';
export declare class ScimTokenController {
    private readonly logger;
    private readonly scimTokenService;
    private readonly scimSettingsService;
    private readonly moduleRegistry;
    constructor(logger: Logger, scimTokenService: ScimTokenService, scimSettingsService: ScimSettingsService, moduleRegistry: ModuleRegistry);
    getConfig(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateConfig(_req: AuthenticatedRequest, res: Response, body: ScimConfigPatchDto): Promise<Response<any, Record<string, any>>>;
    generateToken(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteToken(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
