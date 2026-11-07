import { DismissBannerRequestDto, OwnerSetupRequestDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { PostHogClient } from '../posthog';
import { BannerService } from '../services/banner.service';
import { OwnershipService } from '../services/ownership.service';
import { UserService } from '../services/user.service';
export declare class OwnerController {
    private readonly authService;
    private readonly bannerService;
    private readonly userService;
    private readonly postHog;
    private readonly ownershipService;
    constructor(authService: AuthService, bannerService: BannerService, userService: UserService, postHog: PostHogClient, ownershipService: OwnershipService);
    setupOwner(req: AuthenticatedRequest, res: Response, payload: OwnerSetupRequestDto): Promise<import("@n8n/db").PublicUser>;
    dismissBanner(_req: AuthenticatedRequest, _res: Response, payload: DismissBannerRequestDto): Promise<void>;
}
