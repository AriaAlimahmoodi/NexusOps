import { User, WithTimestamps } from '@n8n/db';
import { OAuthClient } from './oauth-client.entity';
export declare class RefreshToken extends WithTimestamps {
    token: string;
    client: OAuthClient;
    clientId: string;
    user: User;
    userId: string;
    expiresAt: number;
    scope: string[];
    resource: string;
}
