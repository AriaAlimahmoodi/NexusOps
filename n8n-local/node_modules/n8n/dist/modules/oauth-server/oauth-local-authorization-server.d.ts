import { UrlService } from '@n8n/backend-services';
import { ProtectedResourceRegistry } from '@n8n/backend-services/auth';
import { LocalAuthorizationServer, type AuthorizationServerMetadata, type Jwk } from '@n8n/inbound-auth';
import { AccessTokenRepository } from './database/repositories/oauth-access-token.repository';
import { OAuthSigningJwksProvider } from './oauth-signing-jwks.provider';
export declare class OAuthServerLocalAuthorizationServer extends LocalAuthorizationServer {
    private readonly urlService;
    private readonly resourceRegistry;
    private readonly jwksProvider;
    private readonly accessTokens;
    constructor(urlService: UrlService, resourceRegistry: ProtectedResourceRegistry, jwksProvider: OAuthSigningJwksProvider, accessTokens: AccessTokenRepository);
    getMetadata(): Promise<AuthorizationServerMetadata>;
    getJwks(): Promise<{
        keys: Jwk[];
    }>;
    isAccessTokenActive(token: string): Promise<boolean>;
}
