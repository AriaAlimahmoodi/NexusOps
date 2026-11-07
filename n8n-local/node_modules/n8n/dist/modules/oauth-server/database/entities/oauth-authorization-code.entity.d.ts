import { User, WithTimestamps } from '@n8n/db';
import { OAuthClient } from './oauth-client.entity';
export declare class AuthorizationCode extends WithTimestamps {
    code: string;
    client: OAuthClient;
    clientId: string;
    user: User;
    userId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    state: string | null;
    resource: string | null;
    scope: string[];
    expiresAt: number;
    used: boolean;
}
