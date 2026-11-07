export interface WorkflowNodeTaskPayload {
    workflowId: string;
    nodeId: string;
}
export declare const isWorkflowNodeTaskPayload: (payload: Record<string, unknown>) => payload is Record<string, unknown> & WorkflowNodeTaskPayload;
