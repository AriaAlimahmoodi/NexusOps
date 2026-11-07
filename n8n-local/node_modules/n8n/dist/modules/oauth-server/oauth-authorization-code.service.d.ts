import type { OperationContext } from '@n8n/db';
import type { AuthorizationCode } from './database/entities/oauth-authorization-code.entity';
import { AuthorizationCodeRepository } from './database/repositories/oauth-authorization-code.repository';
export declare class OAuthAuthorizationCodeService {
    private readonly authorizationCodeRepository;
    private readonly AUTHORIZATION_CODE_EXPIRY_MS;
    constructor(authorizationCodeRepository: AuthorizationCodeRepository);
    createAuthorizationCode(clientId: string, userId: string, redirectUri: string, codeChallenge: string, state: string | null, resource?: string, scopes?: string[], ctx?: OperationContext): Promise<string>;
    findAndValidateAuthorizationCode(authorizationCode: string, clientId: string): Promise<AuthorizationCode>;
    findAuthorizationCode(code: string, clientId: string, redirectUri?: string): Promise<AuthorizationCode | null>;
    validateAndConsumeAuthorizationCode(authorizationCode: string, clientId: string, redirectUri?: string): Promise<AuthorizationCode>;
    markAuthorizationCodeAsUsed(authorizationCode: string, ctx?: OperationContext): Promise<void>;
    deleteForGrant(clientId: string, userId: string): Promise<void>;
    getCodeChallenge(authorizationCode: string, clientId: string): Promise<string>;
}
