import type { WorkflowEntity } from '@n8n/db';
import type { WorkflowSubWorkflowRequirement } from '../workflow.types';
export declare function extractWorkflowRequirements(workflow: WorkflowEntity): WorkflowSubWorkflowRequirement[];
