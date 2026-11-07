import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { Response } from 'express';
import { CredentialsOverwrites } from '../../credentials-overwrites';
import { OauthService } from '../../oauth/oauth.service';
import { OAuthRequest } from '../../requests';
export declare class OAuth1CredentialController {
    private readonly oauthService;
    private readonly logger;
    private readonly eventService;
    private readonly credentialsOverwrites;
    constructor(oauthService: OauthService, logger: Logger, eventService: EventService, credentialsOverwrites: CredentialsOverwrites);
    getAuthUri(req: OAuthRequest.OAuth1Credential.Auth, res: Response): Promise<string>;
    handleCallback(req: OAuthRequest.OAuth1Credential.Callback, res: Response): Promise<void>;
}
