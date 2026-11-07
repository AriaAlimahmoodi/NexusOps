import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { OAuthJweServiceProxy } from '@n8n/backend-services/auth';
import { Response } from 'express';
import { CredentialsOverwrites } from '../../credentials-overwrites';
import { ExternalHooks } from '../../external-hooks';
import { OauthService } from '../../oauth/oauth.service';
import { OAuthRequest } from '../../requests';
export declare class OAuth2CredentialController {
    private readonly oauthService;
    private readonly logger;
    private readonly externalHooks;
    private readonly oauthJweServiceProxy;
    private readonly eventService;
    private readonly credentialsOverwrites;
    constructor(oauthService: OauthService, logger: Logger, externalHooks: ExternalHooks, oauthJweServiceProxy: OAuthJweServiceProxy, eventService: EventService, credentialsOverwrites: CredentialsOverwrites);
    getAuthUri(req: OAuthRequest.OAuth2Credential.Auth, res: Response): Promise<string>;
    handleCallback(req: OAuthRequest.OAuth2Credential.Callback, res: Response): Promise<void>;
    private convertCredentialToOptions;
}
