import type { PublishHistoryScope, User } from '@n8n/db';
import type { Scope } from '@n8n/permissions';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
type SdkReferenceHintOptions = {
    afterReference?: string;
};
export declare function getSdkReferenceHint(error: unknown, options?: SdkReferenceHintOptions): string | undefined;
export type FoundWorkflow = NonNullable<Awaited<ReturnType<WorkflowFinderService['findWorkflowForUser']>>>;
export type GetMcpWorkflowOptions = {
    includeActiveVersion?: boolean;
    includeTags?: boolean;
    includeParentFolder?: boolean;
    publishHistory?: PublishHistoryScope;
};
export declare function validateMcpWorkflow<T extends Pick<FoundWorkflow, 'id' | 'isArchived' | 'settings'>>(workflow: T | null | undefined): T;
export declare function getMcpWorkflow(workflowId: string, user: User, scopes: Scope[], workflowFinderService: WorkflowFinderService, options?: GetMcpWorkflowOptions): Promise<FoundWorkflow>;
export {};
