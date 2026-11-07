import type { PolicedWorkflow } from '@n8n/decorators';
import type { OwnershipService } from '../services/ownership.service';
import type { PolicyActor } from './policy-enforcement-backend';
import type { PolicyEnforcementService } from './policy-enforcement.service';
export declare function enforceWorkflowPublishPolicy(policyEnforcementService: PolicyEnforcementService, ownershipService: OwnershipService, workflow: PolicedWorkflow & {
    id: string;
}, actor: PolicyActor): Promise<void>;
