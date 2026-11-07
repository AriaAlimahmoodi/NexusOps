import { LicenseState } from '@n8n/backend-common';
import type { WorkflowIdsQuery } from '@n8n/db';
import { PolicyEnforcementService } from '../../policy/policy-enforcement.service';
import type { RestrictedNodeTypesProvider } from '@n8n/backend-services';
import { RestrictedWorkflowRepository } from './database/repositories/restricted-workflow.repository';
import { TypeAvailabilityPolicyService } from './type-availability-policy.service';
export declare class NodeTypePolicyRestrictedTypesProvider implements RestrictedNodeTypesProvider {
    private readonly service;
    private readonly licenseState;
    private readonly restrictedWorkflowRepository;
    private readonly policyEnforcementService;
    readonly findRestrictedWorkflowIds: () => Promise<WorkflowIdsQuery | null>;
    constructor(service: TypeAvailabilityPolicyService, licenseState: LicenseState, restrictedWorkflowRepository: RestrictedWorkflowRepository, policyEnforcementService: PolicyEnforcementService);
    private findRestrictedNodeTypes;
}
