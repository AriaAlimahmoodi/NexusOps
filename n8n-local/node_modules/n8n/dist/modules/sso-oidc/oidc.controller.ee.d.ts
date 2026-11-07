import { OidcConfigDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService, UrlService } from '@n8n/backend-services';
import { GlobalConfig, InstanceSettingsLoaderConfig } from '@n8n/config';
import { AuthenticatedRequest } from '@n8n/db';
import { Request, Response } from 'express';
import { AuthService } from '../../auth/auth.service';
import { AuthlessRequest } from '../../requests';
import { OidcService } from './oidc.service.ee';
export declare class OidcController {
    private readonly oidcService;
    private readonly authService;
    private readonly eventService;
    private readonly urlService;
    private readonly globalConfig;
    private readonly logger;
    private readonly instanceSettingsLoaderConfig;
    constructor(oidcService: OidcService, authService: AuthService, eventService: EventService, urlService: UrlService, globalConfig: GlobalConfig, logger: Logger, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    retrieveConfiguration(_req: AuthenticatedRequest): Promise<Pick<OidcConfigDto, "additionalScopes" | "authenticationContextClassReference" | "clientId" | "clientSecret" | "emailVerifiedRequired" | "loginEnabled" | "prompt" | "rpInitiatedLogoutEnabled"> & {
        discoveryEndpoint: URL;
    }>;
    saveConfiguration(_req: AuthenticatedRequest, _res: Response, payload: OidcConfigDto): Promise<OidcConfigDto>;
    testConnection(_req: AuthenticatedRequest, res: Response): Promise<{
        url: string;
    }>;
    redirectToAuthProvider(req: Request<{}, {}, {}, {
        redirect?: string;
    }>, res: Response): Promise<void>;
    callbackHandler(req: AuthlessRequest, res: Response): Promise<void | Response<any, Record<string, any>>>;
    logout(req: AuthenticatedRequest, res: Response): Promise<{
        redirectUrl: string | null;
    }>;
}
