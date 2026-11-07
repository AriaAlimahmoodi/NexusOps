import { Logger } from '@n8n/backend-common';
import type { PolicyActor } from '../../../policy/policy-enforcement-backend';
import { PolicyEnforcementService } from '../../../policy/policy-enforcement.service';
import type { CredentialBindingRequest, CredentialResolution } from '../entities/credential/credential.types';
import type { BlockingIssue } from '../n8n-packages.types';
export declare class CredentialSavePolicyGate {
    private readonly policyEnforcementService;
    private readonly logger;
    constructor(policyEnforcementService: PolicyEnforcementService, logger: Logger);
    refusedStubs(request: CredentialBindingRequest, resolution: CredentialResolution, projectId: string, actor: PolicyActor): Promise<BlockingIssue[]>;
}
