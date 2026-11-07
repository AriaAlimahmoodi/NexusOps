import type { AuthenticatedRequest } from '@n8n/db';
import { AuthService } from '../auth/auth.service';
import type { AuthStrategy, AuthStrategyOptions } from '@n8n/backend-services/auth';
export declare class SessionCookieAuthStrategy implements AuthStrategy {
    private readonly authService;
    constructor(authService: AuthService);
    buildTokenGrant(_token: string, _options?: AuthStrategyOptions): Promise<null>;
    authenticate(req: AuthenticatedRequest): Promise<boolean | null>;
    private toGrant;
    private isAuthFailure;
}
