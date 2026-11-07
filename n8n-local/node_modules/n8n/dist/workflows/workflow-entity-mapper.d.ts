import { WorkflowEntity } from '@n8n/db';
declare const workflowEntityWriteFields: readonly ["id", "name", "description", "nodes", "connections", "settings", "staticData", "meta", "pinData", "nodeGroups"];
type WorkflowEntityWriteField = (typeof workflowEntityWriteFields)[number];
export declare function createWorkflowEntityFromPayload(payload: Partial<Record<WorkflowEntityWriteField, unknown>>): WorkflowEntity;
export {};
