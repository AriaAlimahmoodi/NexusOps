import { NextFunction, Response, Request } from 'express';
import { JwtService } from '@n8n/backend-services';
import { OAuthTokenVerifierProxy, type UserWithContext } from '@n8n/backend-services/auth';
import { Telemetry } from '../../telemetry';
import { McpServerApiKeyService } from './mcp-api-key.service';
import { McpProtectedResource } from './mcp-protected-resource';
export declare class McpServerMiddlewareService {
    private readonly mcpServerApiKeyService;
    private readonly oauthTokenVerifier;
    private readonly mcpProtectedResource;
    private readonly jwtService;
    private readonly telemetry;
    constructor(mcpServerApiKeyService: McpServerApiKeyService, oauthTokenVerifier: OAuthTokenVerifierProxy, mcpProtectedResource: McpProtectedResource, jwtService: JwtService, telemetry: Telemetry);
    getUserForToken(token: string): Promise<UserWithContext>;
    getEnabledMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private extractBearerToken;
    private responseWithUnauthorized;
    private trackFailedConnection;
}
