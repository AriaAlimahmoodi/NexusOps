import type { WorkflowEntity } from '@n8n/db';
import { type SerializedWorkflowMetadata } from '../../spec/serialized/workflow-metadata.schema';
import { type SerializedWorkflow } from '../../spec/serialized/workflow.schema';
export type WorkflowPackageContent = Pick<WorkflowEntity, 'name' | 'nodes' | 'connections' | 'nodeGroups' | 'isArchived' | 'settings'>;
export declare class WorkflowSerializer {
    serialize(workflow: WorkflowEntity, options: {
        includeTags: boolean;
    }): SerializedWorkflow;
    serializeMetadata(workflow: WorkflowEntity): SerializedWorkflowMetadata;
    deserialize(wire: SerializedWorkflow): WorkflowPackageContent;
}
