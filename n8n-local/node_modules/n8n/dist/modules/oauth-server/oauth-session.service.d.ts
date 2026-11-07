import { GlobalConfig } from '@n8n/config';
import type { Response } from 'express';
import { z } from 'zod';
import { JwtService } from '@n8n/backend-services';
declare const oauthSessionPayloadSchema: z.ZodObject<{
    clientId: z.ZodString;
    redirectUri: z.ZodString;
    codeChallenge: z.ZodString;
    state: z.ZodNullable<z.ZodString>;
    resource: z.ZodOptional<z.ZodString>;
    requestedScopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string | null;
    resource?: string | undefined;
    requestedScopes?: string[] | undefined;
}, {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string | null;
    resource?: string | undefined;
    requestedScopes?: string[] | undefined;
}>;
export type OAuthSessionPayload = z.infer<typeof oauthSessionPayloadSchema>;
export declare const OAUTH_SESSION_COOKIE_PREFIX = "n8n-oauth-session-";
export declare class OAuthSessionService {
    private readonly jwtService;
    private readonly globalConfig;
    constructor(jwtService: JwtService, globalConfig: GlobalConfig);
    createSession(res: Response, payload: OAuthSessionPayload): string;
    verifySession(sessionToken: string): OAuthSessionPayload;
    clearSession(res: Response, flowId: string): void;
    getSessionToken(cookies: Record<string, string | undefined>, flowId: string): string | undefined;
    private newFlowId;
    private evictOldestFlows;
    private cookieOptions;
    private parsedCookies;
}
export {};
