import { Logger } from '@n8n/backend-common';
import type { JWK } from 'jose';
import type { JwksProvider } from '@n8n/backend-services/auth';
import { OAuthJweKeyService } from './oauth-jwe-key.service';
export declare class OAuthJweJwksProvider implements JwksProvider {
    private readonly jweKeyService;
    private readonly logger;
    readonly id = "oauth-jwe";
    constructor(jweKeyService: OAuthJweKeyService, logger: Logger);
    getPublicJwks(): Promise<JWK[]>;
}
