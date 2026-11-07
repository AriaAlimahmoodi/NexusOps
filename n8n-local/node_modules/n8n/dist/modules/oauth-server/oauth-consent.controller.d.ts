import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { ApproveConsentRequestDto } from './dto/approve-consent-request.dto';
import { OAuthConsentService } from './oauth-consent.service';
import { OAuthSessionService } from './oauth-session.service';
type ConsentDetailsRequest = AuthenticatedRequest<{}, {}, {}, {
    flow?: string;
}>;
export declare class OAuthConsentController {
    private readonly logger;
    private readonly consentService;
    private readonly oauthSessionService;
    constructor(logger: Logger, consentService: OAuthConsentService, oauthSessionService: OAuthSessionService);
    getConsentDetails(req: ConsentDetailsRequest, res: Response): Promise<void>;
    approveConsent(req: AuthenticatedRequest, res: Response, payload: ApproveConsentRequestDto): Promise<void>;
    private sendErrorResponse;
    private sendInvalidSessionError;
    private getAndValidateSessionToken;
}
export {};
