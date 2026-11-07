import { Logger } from '@n8n/backend-common';
import type { ContentImportTransport } from '@n8n/decorators';
import type { PolicyActor } from '../../../policy/policy-enforcement-backend';
import { PolicyEnforcementService } from '../../../policy/policy-enforcement.service';
import type { WorkflowPlanItem } from '../entities/workflow/workflow-import.types';
import type { BlockingIssue, PackageImportSource } from '../n8n-packages.types';
export declare function contentImportTransport(source: PackageImportSource | undefined): ContentImportTransport;
export declare class ContentImportPolicyGate {
    private readonly policyEnforcementService;
    private readonly logger;
    constructor(policyEnforcementService: PolicyEnforcementService, logger: Logger);
    refusedWorkflows(items: WorkflowPlanItem[], projectId: string, transport: ContentImportTransport, actor: PolicyActor): Promise<BlockingIssue[]>;
}
