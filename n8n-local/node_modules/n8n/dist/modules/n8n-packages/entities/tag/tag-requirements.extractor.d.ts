import type { WorkflowEntity } from '@n8n/db';
import type { WorkflowTagUsage } from './tag.types';
import type { RequirementsExtractor } from '../requirements-extractor';
export declare class TagRequirementsExtractor implements RequirementsExtractor<WorkflowTagUsage> {
    extract(workflow: WorkflowEntity): WorkflowTagUsage[];
}
