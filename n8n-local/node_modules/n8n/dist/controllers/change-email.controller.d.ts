import { ChangeEmailRequestDto, ConfirmEmailChangeRequestDto, ResolveChangeEmailTokenQueryDto, type ChangeEmailResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { AuthenticatedRequest, UserRepository } from '@n8n/db';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { ExternalHooks } from '../external-hooks';
import { AuthlessRequest } from '../requests';
import { EmailChangeService } from '../services/email-change.service';
import { UserService } from '../services/user.service';
import { UserManagementMailer } from '../user-management/email';
export declare class ChangeEmailController {
    private readonly logger;
    private readonly externalHooks;
    private readonly authService;
    private readonly userService;
    private readonly userRepository;
    private readonly mailer;
    private readonly emailChangeService;
    private readonly eventService;
    constructor(logger: Logger, externalHooks: ExternalHooks, authService: AuthService, userService: UserService, userRepository: UserRepository, mailer: UserManagementMailer, emailChangeService: EmailChangeService, eventService: EventService);
    requestEmailChange(req: AuthenticatedRequest, res: Response, payload: ChangeEmailRequestDto): Promise<ChangeEmailResponse>;
    resolveChangeEmailToken(_req: AuthlessRequest, _res: Response, payload: ResolveChangeEmailTokenQueryDto): Promise<{
        email: string;
    }>;
    confirmEmailChange(_req: AuthlessRequest, _res: Response, payload: ConfirmEmailChangeRequestDto): Promise<{
        success: true;
    }>;
    private assertEmailAvailable;
    private applyEmailChange;
}
