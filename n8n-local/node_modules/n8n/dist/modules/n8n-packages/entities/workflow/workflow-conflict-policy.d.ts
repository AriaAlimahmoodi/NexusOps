import type { WorkflowEntity } from '@n8n/db';
import type { WorkflowDecision } from './workflow-import.types';
import type { WorkflowConflictPolicy } from '../../n8n-packages.types';
export declare function decideWorkflowConflictAction(policy: WorkflowConflictPolicy, existing: WorkflowEntity | null): WorkflowDecision;
