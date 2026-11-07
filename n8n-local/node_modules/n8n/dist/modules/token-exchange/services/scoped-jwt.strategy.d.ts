import type { AuthenticatedRequest, TokenGrant } from '@n8n/db';
import { UserRepository } from '@n8n/db';
import type { AuthStrategy, AuthStrategyOptions } from '@n8n/backend-services/auth';
import { JwtService } from '@n8n/backend-services';
export declare class ScopedJwtStrategy implements AuthStrategy {
    private readonly jwtService;
    private readonly userRepository;
    constructor(jwtService: JwtService, userRepository: UserRepository);
    buildTokenGrant(token: string, options?: AuthStrategyOptions): Promise<TokenGrant | false | null>;
    authenticate(req: AuthenticatedRequest): Promise<boolean | null>;
    private findUser;
    private extractToken;
}
