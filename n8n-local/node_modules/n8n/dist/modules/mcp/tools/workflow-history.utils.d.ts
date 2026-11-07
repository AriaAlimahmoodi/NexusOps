import type { User, WorkflowHistory } from '@n8n/db';
import type { WorkflowHistoryService } from '../../../workflows/workflow-history/workflow-history.service';
export declare function getMcpWorkflowVersion(workflowHistoryService: WorkflowHistoryService, user: User, workflowId: string, versionId: string): Promise<WorkflowHistory>;
