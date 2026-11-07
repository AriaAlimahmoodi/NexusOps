import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { AuthenticatedRequest, User } from '@n8n/db';
import { InvalidAuthTokenRepository, UserRepository } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import type { StringValue as TimeUnitValue } from 'ms';
import { License } from '../license';
import { MfaService } from '../mfa/mfa.service';
import { JwtService, UrlService, EventService } from '@n8n/backend-services';
interface CreateAuthMiddlewareOptions {
    allowSkipMFA: boolean;
    allowSkipPreviewAuth?: boolean;
    allowUnauthenticated?: boolean;
}
export declare class AuthService {
    private readonly eventService;
    private readonly globalConfig;
    private readonly logger;
    private readonly license;
    private readonly jwtService;
    private readonly urlService;
    private readonly userRepository;
    private readonly invalidAuthTokenRepository;
    private readonly mfaService;
    private skipBrowserIdCheckEndpoints;
    constructor(eventService: EventService, globalConfig: GlobalConfig, logger: Logger, license: License, jwtService: JwtService, urlService: UrlService, userRepository: UserRepository, invalidAuthTokenRepository: InvalidAuthTokenRepository, mfaService: MfaService);
    createAuthMiddleware({ allowSkipMFA, allowSkipPreviewAuth, allowUnauthenticated, }: CreateAuthMiddlewareOptions): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    createAssetAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    private isAuthJwtPayload;
    getCookieToken(req: Request): string | undefined;
    getBrowserId(req: Request): string | undefined;
    getMethod(req: Request): string;
    getEndpoint(req: Request): string;
    clearCookie(res: Response): void;
    invalidateToken(req: AuthenticatedRequest): Promise<void>;
    issueCookie(res: Response, user: User, usedMfa: boolean, browserId?: string, isEmbed?: boolean, cookieOverrides?: {
        sameSite?: 'strict' | 'lax' | 'none';
        secure?: boolean;
    }): void;
    private setAuthCookie;
    issueJWT(user: User, usedMfa?: boolean, browserId?: string, isEmbed?: boolean): string;
    validateCookieToken(token: string): Promise<User>;
    authenticateUserBasedOnToken(token: string, method: string, endpoint: string, browserId: string | undefined): Promise<User>;
    authenticateUserByCookie(cookie: string): Promise<User>;
    private checkMfaGate;
    private endpointSkipsBrowserIdCheck;
    private validateBrowserId;
    private validateToken;
    resolveJwt(token: string, req: AuthenticatedRequest, res: Response): Promise<[User, {
        usedMfa: boolean;
    }]>;
    generateEmailChangeUrl(user: User, newEmail: string): string;
    resolveEmailChangeToken(token: string): Promise<{
        user: User;
        newEmail: string;
    } | undefined>;
    generatePasswordResetToken(user: User, expiresIn?: TimeUnitValue): string;
    generatePasswordResetUrl(user: User): string;
    resolvePasswordResetToken(token: string): Promise<User | undefined>;
    createJWTHash({ email, password, mfaEnabled, mfaSecret }: User): string;
    private hash;
    get jwtRefreshTimeout(): number;
    get jwtExpiration(): number;
}
export {};
