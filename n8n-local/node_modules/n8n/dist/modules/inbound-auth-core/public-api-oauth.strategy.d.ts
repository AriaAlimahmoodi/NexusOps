import type { AuthenticatedRequest, TokenGrant } from '@n8n/db';
import { UserRepository } from '@n8n/db';
import { ResourceAdmission } from '@n8n/inbound-auth';
import type { AuthStrategy } from '@n8n/backend-services/auth';
import { JwtService } from '@n8n/backend-services';
import { PublicApiProtectedResource } from './public-api-protected-resource';
export declare class PublicApiOAuthStrategy implements AuthStrategy {
    private readonly resource;
    private readonly admission;
    private readonly jwtService;
    private readonly userRepository;
    constructor(resource: PublicApiProtectedResource, admission: ResourceAdmission, jwtService: JwtService, userRepository: UserRepository);
    buildTokenGrant(): Promise<TokenGrant | false | null>;
    private isOAuthIssuer;
    authenticate(req: AuthenticatedRequest): Promise<boolean | null>;
}
