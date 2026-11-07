import { User } from '@n8n/db';
import { OAuthClient } from './oauth-client.entity';
export declare class AccessToken {
    token: string;
    client: OAuthClient;
    clientId: string;
    user: User;
    userId: string;
}
