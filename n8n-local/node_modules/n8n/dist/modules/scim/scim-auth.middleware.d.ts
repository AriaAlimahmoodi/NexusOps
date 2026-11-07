import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, RequestHandler, Response } from 'express';
import { ScimSettingsService } from './scim-settings.service';
import { ScimTokenService } from './scim-token.service';
export declare class ScimAuthMiddleware {
    private readonly logger;
    private readonly scimTokenService;
    private readonly scimSettingsService;
    constructor(logger: Logger, scimTokenService: ScimTokenService, scimSettingsService: ScimSettingsService);
    getAuthMiddleware(): RequestHandler;
    authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    private unauthorized;
}
