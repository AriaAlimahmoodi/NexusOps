import { Logger } from '@n8n/backend-common';
import { EventService, RoleService } from '@n8n/backend-services';
import { AuthIdentityRepository, UserRepository, type User } from '@n8n/db';
import { UserService } from '../../../services/user.service';
import { TokenExchangeConfig } from '../token-exchange.config';
import type { ExternalTokenClaims } from '../token-exchange.schemas';
import { TrustedKeyService } from './trusted-key.service';
export declare function qualifiedProviderId(issuer: string, sub: string): string;
export declare class IdentityResolutionService {
    private readonly userRepository;
    private readonly authIdentityRepository;
    private readonly eventService;
    private readonly userService;
    private readonly trustedKeyService;
    private readonly roleService;
    private readonly config;
    private readonly logger;
    constructor(logger: Logger, userRepository: UserRepository, authIdentityRepository: AuthIdentityRepository, eventService: EventService, userService: UserService, trustedKeyService: TrustedKeyService, roleService: RoleService, config: TokenExchangeConfig);
    private assertKeyMayActAsUser;
    private assertEmailVerified;
    resolve(claims: ExternalTokenClaims, allowedRoles: string[] | undefined, tokenContext: {
        kid: string;
        issuer: string;
        requireVerifiedEmail: boolean;
    }): Promise<User>;
    private resolveByIdentity;
    private resolveByEmail;
    private provisionUser;
    private resolveRoleForExistingUser;
    private resolveRoleForNewUser;
    private syncProfile;
}
