import { RoleChangeRequestDto, SettingsUpdateRequestDto, UsersListFilterDto } from '@n8n/api-types';
import { UserRepository, AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { UserRequest } from '../requests';
import { JwtService, UrlService } from '@n8n/backend-services';
import { UserService } from '../services/user.service';
export declare class UsersController {
    private readonly userRepository;
    private readonly authService;
    private readonly userService;
    private readonly jwtService;
    private readonly urlService;
    constructor(userRepository: UserRepository, authService: AuthService, userService: UserService, jwtService: JwtService, urlService: UrlService);
    private removeSupplementaryFields;
    listUsers(req: AuthenticatedRequest, _res: Response, listQueryOptions: UsersListFilterDto): Promise<{
        count: number;
        items: {
            id: string;
            firstName?: string | null | undefined;
            lastName?: string | null | undefined;
            email?: string | null | undefined;
            role?: string | undefined;
            isPending?: boolean | undefined;
            isOwner?: boolean | undefined;
            signInType?: string | undefined;
            settings?: {
                isOnboarded?: boolean | undefined;
                firstSuccessfulWorkflowId?: string | undefined;
                userActivated?: boolean | undefined;
                userActivatedAt?: number | undefined;
                allowSSOManualLogin?: boolean | undefined;
                npsSurvey?: {
                    lastShownAt: number;
                    responded: true;
                } | {
                    lastShownAt: number;
                    waitingForResponse: true;
                    ignoredCount: number;
                } | undefined;
                easyAIWorkflowOnboarded?: boolean | undefined;
                userClaimedAiCredits?: boolean | undefined;
                dismissedCallouts?: Record<string, boolean> | undefined;
            } | null | undefined;
            personalizationAnswers?: import("zod").objectOutputType<{}, import("zod").ZodTypeAny, "passthrough"> | null | undefined;
            projectRelations?: {
                id: string;
                role: string;
                name: string;
                icon?: {
                    type: "emoji" | "icon";
                    value: string;
                    color?: string | undefined;
                } | null | undefined;
            }[] | null | undefined;
            mfaEnabled?: boolean | undefined;
            lastActiveAt?: string | null | undefined;
            inviteAcceptUrl?: string | undefined;
            isManagedByEnv?: boolean | undefined;
        }[];
    }>;
    getUserPasswordResetLink(req: UserRequest.PasswordResetLink): Promise<{
        link: string;
    }>;
    generateInviteLink(req: AuthenticatedRequest<{
        id: string;
    }, {}, {}, {}>, _res: Response): Promise<{
        link: string;
    }>;
    updateUserSettings(_req: AuthenticatedRequest, _res: Response, payload: SettingsUpdateRequestDto, id: string): Promise<import("n8n-workflow").IUserSettings | null>;
    deleteUser(req: UserRequest.Delete): Promise<{
        success: boolean;
    }>;
    changeGlobalRole(req: AuthenticatedRequest, _: Response, payload: RoleChangeRequestDto, id: string): Promise<{
        success: boolean;
    }>;
}
