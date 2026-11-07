import { AcceptInvitationRequestDto, InviteUsersRequestDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { UserRepository, AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { ExternalHooks } from '../external-hooks';
import { PostHogClient } from '../posthog';
import { AuthlessRequest } from '../requests';
import { PasswordUtility } from '../services/password.utility';
import { UserService } from '../services/user.service';
export declare class InvitationController {
    private readonly logger;
    private readonly externalHooks;
    private readonly authService;
    private readonly userService;
    private readonly passwordUtility;
    private readonly userRepository;
    private readonly postHog;
    private readonly eventService;
    constructor(logger: Logger, externalHooks: ExternalHooks, authService: AuthService, userService: UserService, passwordUtility: PasswordUtility, userRepository: UserRepository, postHog: PostHogClient, eventService: EventService);
    inviteUser(req: AuthenticatedRequest, _res: Response, invitations: InviteUsersRequestDto): Promise<import("../requests").UserRequest.InviteResponse[]>;
    private processInvitationAcceptance;
    acceptInvitationWithToken(req: AuthlessRequest, res: Response, payload: AcceptInvitationRequestDto): Promise<import("@n8n/db").PublicUser>;
}
