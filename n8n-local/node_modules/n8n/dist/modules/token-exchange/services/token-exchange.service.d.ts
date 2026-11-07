import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { JwtService } from '@n8n/backend-services';
import { TokenExchangeConfig } from '../token-exchange.config';
import type { ExternalTokenClaims, ResolvedTrustedKey, TokenExchangeRequest } from '../token-exchange.schemas';
import { type IssuedTokenResult } from '../token-exchange.types';
import { IdentityResolutionService } from './identity-resolution.service';
import { JtiStoreService } from './jti-store.service';
import { TrustedKeyService } from './trusted-key.service';
export declare class TokenExchangeService {
    private readonly trustedKeyStore;
    private readonly jtiStore;
    private readonly identityResolutionService;
    private readonly config;
    private readonly jwtService;
    private readonly logger;
    constructor(logger: Logger, trustedKeyStore: TrustedKeyService, jtiStore: JtiStoreService, identityResolutionService: IdentityResolutionService, config: TokenExchangeConfig, jwtService: JwtService);
    verifyToken(subjectToken: string, { maxLifetimeSeconds }?: {
        maxLifetimeSeconds?: number;
    }): Promise<{
        claims: ExternalTokenClaims;
        resolvedKey: ResolvedTrustedKey;
    }>;
    embedLogin(subjectToken: string): Promise<{
        user: User;
        subject: string;
        issuer: string;
        kid: string;
    }>;
    exchange(request: TokenExchangeRequest): Promise<IssuedTokenResult>;
}
