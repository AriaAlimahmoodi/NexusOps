import { UpdateSecuritySettingsDto } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { type AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { SecuritySettingsService } from '../services/security-settings.service';
import { WorkflowReviewPolicyService } from '../services/workflow-review-policy.service';
export declare class SecuritySettingsController {
    private readonly securitySettingsService;
    private readonly workflowReviewPolicyService;
    private readonly licenseState;
    private readonly instanceSettingsLoaderConfig;
    constructor(securitySettingsService: SecuritySettingsService, workflowReviewPolicyService: WorkflowReviewPolicyService, licenseState: LicenseState, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    getSecuritySettings(_req: AuthenticatedRequest, _res: Response): Promise<{
        personalSpacePublishing: boolean;
        personalSpaceSharing: boolean;
        publishedPersonalWorkflowsCount: number;
        sharedPersonalWorkflowsCount: number;
        sharedPersonalCredentialsCount: number;
        redactionEnforcement: {
            floor: import("@n8n/api-types").RedactionFloor;
        };
        managedByEnv: boolean;
        workflowReviews?: {
            enabled: boolean;
        } | undefined;
    }>;
    updateSecuritySettings(req: AuthenticatedRequest, _res: Response, dto: UpdateSecuritySettingsDto): Promise<Partial<UpdateSecuritySettingsDto>>;
    private isWorkflowReviewsAvailable;
    private getWorkflowReviewsIfAvailable;
    private assertWorkflowReviewsAvailable;
}
