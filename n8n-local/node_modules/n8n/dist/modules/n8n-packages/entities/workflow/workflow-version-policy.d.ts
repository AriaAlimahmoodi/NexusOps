import { WorkflowEntity } from '@n8n/db';
import { ExportVersionPolicy } from '../../n8n-packages.types';
export declare function needsActiveVersion(policy: ExportVersionPolicy): boolean;
export declare function applyWorkflowVersionPolicy(workflows: WorkflowEntity[], policy: ExportVersionPolicy): WorkflowEntity[];
