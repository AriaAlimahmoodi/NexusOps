import { User } from '@n8n/db';
import { OAuthClient } from './oauth-client.entity';
export declare class UserConsent {
    id: number;
    user: User;
    userId: string;
    client: OAuthClient;
    clientId: string;
    grantedAt: number;
    scope: string[];
}
