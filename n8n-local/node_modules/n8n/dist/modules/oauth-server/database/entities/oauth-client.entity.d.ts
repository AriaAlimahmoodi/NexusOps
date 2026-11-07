import { WithTimestamps } from '@n8n/db';
import type { AccessToken } from './oauth-access-token.entity';
import type { AuthorizationCode } from './oauth-authorization-code.entity';
import type { RefreshToken } from './oauth-refresh-token.entity';
import type { UserConsent } from './oauth-user-consent.entity';
export declare class OAuthClient extends WithTimestamps {
    id: string;
    name: string;
    redirectUris: string[];
    grantTypes: string[];
    tokenEndpointAuthMethod: string;
    isFirstParty: boolean;
    authorizationCodes: AuthorizationCode[];
    accessTokens: AccessToken[];
    refreshTokens: RefreshToken[];
    userConsents: UserConsent[];
    clientSecret: string | null;
    clientSecretExpiresAt: number | null;
}
