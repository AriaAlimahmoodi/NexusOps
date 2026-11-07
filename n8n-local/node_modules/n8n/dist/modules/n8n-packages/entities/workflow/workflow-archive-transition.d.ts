export type WorkflowArchiveTransition = 'archive' | 'unarchive';
export declare function decideWorkflowArchiveTransition(packageArchived: boolean, existingArchived: boolean): WorkflowArchiveTransition | null;
