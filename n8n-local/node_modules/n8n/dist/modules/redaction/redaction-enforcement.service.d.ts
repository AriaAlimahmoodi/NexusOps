import type { WorkflowSettings } from 'n8n-workflow';
import { InstanceRedactionEnforcementService } from './instance-redaction-enforcement.service';
export declare class RedactionEnforcementService {
    private readonly instanceRedactionEnforcementService;
    constructor(instanceRedactionEnforcementService: InstanceRedactionEnforcementService);
    assertPolicyChangeAllowed(currentPolicy: WorkflowSettings.RedactionPolicy | undefined, incomingPolicy: WorkflowSettings.RedactionPolicy | undefined): Promise<void>;
    assertNewPolicyAllowed(incomingPolicy: WorkflowSettings.RedactionPolicy | undefined): Promise<void>;
}
