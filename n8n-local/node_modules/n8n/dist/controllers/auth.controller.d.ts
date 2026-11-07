import { LoginRequestDto, ResolveSignupTokenQueryDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import type { PublicUser } from '@n8n/db';
import { UserRepository, AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { AuthHandlerRegistry } from '../auth/auth-handler.registry';
import { AuthService } from '../auth/auth.service';
import { License } from '../license';
import { MfaService } from '../mfa/mfa.service';
import { PostHogClient } from '../posthog';
import { AuthlessRequest } from '../requests';
import { UserService } from '../services/user.service';
import '../auth/handlers/email.auth-handler';
export declare class AuthController {
    private readonly logger;
    private readonly authService;
    private readonly mfaService;
    private readonly userService;
    private readonly license;
    private readonly userRepository;
    private readonly eventService;
    private readonly authHandlerRegistry;
    private readonly postHog?;
    constructor(logger: Logger, authService: AuthService, mfaService: MfaService, userService: UserService, license: License, userRepository: UserRepository, eventService: EventService, authHandlerRegistry: AuthHandlerRegistry, postHog?: PostHogClient | undefined);
    login(req: AuthlessRequest, res: Response, payload: LoginRequestDto): Promise<PublicUser | undefined>;
    private validateEmailFormat;
    private validateSsoRestrictions;
    private authenticateWithPassword;
    private validateMfa;
    currentUser(req: AuthenticatedRequest): Promise<PublicUser>;
    resolveSignupToken(_req: AuthlessRequest, _res: Response, payload: ResolveSignupTokenQueryDto): Promise<{
        inviter: {
            firstName: string;
            lastName: string;
        };
    }>;
    logout(req: AuthenticatedRequest, res: Response): Promise<{
        loggedOut: boolean;
    }>;
}
