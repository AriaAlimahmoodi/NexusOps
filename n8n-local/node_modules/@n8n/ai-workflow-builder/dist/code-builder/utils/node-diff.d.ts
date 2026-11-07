interface NodeLike {
    name?: string;
}
interface WorkflowLike {
    nodes: NodeLike[];
}
export interface NodeDiffResult {
    nodes_added: number;
    nodes_removed: number;
    nodes_modified: number;
}
export declare function calculateNodeChanges(before: WorkflowLike | null | undefined, after: WorkflowLike | null | undefined): NodeDiffResult;
export {};
