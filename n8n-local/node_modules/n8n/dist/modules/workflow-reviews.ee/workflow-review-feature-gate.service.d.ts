import { LicenseState } from '@n8n/backend-common';
import { WorkflowReviewPolicyService } from '../../services/workflow-review-policy.service';
export declare class WorkflowReviewFeatureGate {
    private readonly licenseState;
    private readonly workflowReviewPolicyService;
    constructor(licenseState: LicenseState, workflowReviewPolicyService: WorkflowReviewPolicyService);
    isAvailable(): Promise<boolean>;
    assertAvailable(): Promise<void>;
    private getAvailability;
}
