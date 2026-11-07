import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest, TokenGrant } from '@n8n/db';
import { ApiKeyRepository } from '@n8n/db';
import type { AuthStrategy, AuthStrategyOptions } from '@n8n/backend-services/auth';
import { JwtService } from '@n8n/backend-services';
export declare class ApiKeyAuthStrategy implements AuthStrategy {
    private readonly apiKeyRepository;
    private readonly jwtService;
    private readonly logger;
    constructor(apiKeyRepository: ApiKeyRepository, jwtService: JwtService, logger: Logger);
    buildTokenGrant(token: string, options?: AuthStrategyOptions): Promise<TokenGrant | false | null>;
    private touchLastUsedAt;
    authenticate(req: AuthenticatedRequest): Promise<boolean | null>;
}
