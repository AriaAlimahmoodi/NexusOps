import { Logger } from '@n8n/backend-common';
import type { JWK } from 'jose';
import type { JwksProvider } from '@n8n/backend-services/auth';
import { OAuthSigningKeyService } from './oauth-signing-key.service';
export declare class OAuthSigningJwksProvider implements JwksProvider {
    private readonly signingKeyService;
    private readonly logger;
    readonly id = "oauth-server-signing";
    constructor(signingKeyService: OAuthSigningKeyService, logger: Logger);
    getPublicJwks(): Promise<JWK[]>;
}
