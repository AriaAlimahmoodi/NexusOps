import { StaticRouterMetadata } from '@n8n/decorators';
import { AuthenticationService } from '@n8n/inbound-auth';
import type { Response, Request } from 'express';
import { UrlService } from '@n8n/backend-services';
import { ProtectedResourceRegistry } from '@n8n/backend-services/auth';
import { OAuthServerLocalAuthorizationServer } from './oauth-local-authorization-server';
export declare class OAuthController {
    private readonly urlService;
    private readonly resourceRegistry;
    private readonly localServer;
    private readonly authenticationService;
    constructor(urlService: UrlService, resourceRegistry: ProtectedResourceRegistry, localServer: OAuthServerLocalAuthorizationServer, authenticationService: AuthenticationService);
    private setCorsHeaders;
    static routers: StaticRouterMetadata[];
    metadataOptions(_req: Request, res: Response): void;
    metadata(_req: Request, res: Response): Promise<void>;
    pathInsertedMetadataOptions(_req: Request, res: Response): void;
    pathInsertedMetadata(_req: Request, res: Response): void;
    protectedResourceMetadataOptions(_req: Request, res: Response): void;
    protectedResourceMetadata(req: Request, res: Response): Promise<void>;
    defaultProtectedResourceMetadataOptions(_req: Request, res: Response): void;
    defaultProtectedResourceMetadata(_req: Request, res: Response): Promise<void>;
    private buildProtectedResourceMetadata;
}
