import type { SimpleWorkflow, WorkflowOperation } from '../types/workflow';
export declare function applyOperations(workflow: SimpleWorkflow, operations: WorkflowOperation[]): SimpleWorkflow;
export declare function processOperations(state: {
    workflowJSON: SimpleWorkflow;
    workflowOperations?: WorkflowOperation[] | null;
}): {
    workflowJSON?: undefined;
    workflowOperations?: undefined;
    workflowValidation?: undefined;
} | {
    workflowJSON: SimpleWorkflow;
    workflowOperations: null;
    workflowValidation: null;
};
