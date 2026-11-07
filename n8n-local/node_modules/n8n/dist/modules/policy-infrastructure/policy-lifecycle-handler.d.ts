import type { WorkflowExecuteBeforeContext } from '@n8n/decorators';
import { PolicyEnforcementService } from '../../policy/policy-enforcement.service';
import { OwnershipService } from '../../services/ownership.service';
export declare class PolicyLifecycleHandler {
    private readonly policyEnforcementService;
    private readonly ownershipService;
    constructor(policyEnforcementService: PolicyEnforcementService, ownershipService: OwnershipService);
    onWorkflowExecuteBefore(ctx: WorkflowExecuteBeforeContext): Promise<void>;
}
