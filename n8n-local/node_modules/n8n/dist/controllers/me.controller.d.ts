import { PasswordUpdateRequestDto, UserSelfSettingsUpdateRequestDto, UserUpdateRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import type { User, PublicUser } from '@n8n/db';
import { UserRepository, AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { ExternalHooks } from '../external-hooks';
import { MfaService } from '../mfa/mfa.service';
import { MeRequest } from '../requests';
import { PasswordUtility } from '../services/password.utility';
import { UserService } from '../services/user.service';
export declare class MeController {
    private readonly logger;
    private readonly externalHooks;
    private readonly authService;
    private readonly userService;
    private readonly passwordUtility;
    private readonly userRepository;
    private readonly eventService;
    private readonly mfaService;
    private readonly globalConfig;
    constructor(logger: Logger, externalHooks: ExternalHooks, authService: AuthService, userService: UserService, passwordUtility: PasswordUtility, userRepository: UserRepository, eventService: EventService, mfaService: MfaService, globalConfig: GlobalConfig);
    updateCurrentUser(req: AuthenticatedRequest, _: Response, payload: UserUpdateRequestDto): Promise<PublicUser>;
    private isUserManagedByEnv;
    private isAuthIdentityActive;
    updatePassword(req: AuthenticatedRequest, res: Response, payload: PasswordUpdateRequestDto): Promise<{
        success: boolean;
    }>;
    storeSurveyAnswers(req: MeRequest.SurveyAnswers): Promise<{
        success: boolean;
    }>;
    updateCurrentUserSettings(req: AuthenticatedRequest, _: Response, payload: UserSelfSettingsUpdateRequestDto): Promise<User['settings']>;
}
