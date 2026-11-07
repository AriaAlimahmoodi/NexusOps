import { Relation } from '@n8n/typeorm';
import { WithTimestamps } from './abstract-entity';
import type { WorkflowEntity } from './workflow-entity';
import type { WorkflowHistory } from './workflow-history';
export declare class WorkflowPublishedVersion extends WithTimestamps {
    workflowId: string;
    publishedVersionId: string;
    workflow: Relation<WorkflowEntity>;
    publishedVersion: Relation<WorkflowHistory>;
}
