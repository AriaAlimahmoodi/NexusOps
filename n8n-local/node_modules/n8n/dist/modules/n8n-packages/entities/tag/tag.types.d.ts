import type { TagConflictPolicy, TagMissingMode } from '../../n8n-packages.types';
import type { PackageTagRequirement } from '../../spec/requirements.schema';
import type { PreparedWorkflow } from '../workflow/workflow-import.types';
export interface WorkflowTagUsage {
    workflowId: string;
    tag: {
        id: string;
        name: string;
    };
}
export declare const compareTagsByName: (a: {
    id: string;
    name: string;
}, b: {
    id: string;
    name: string;
}) => number;
export interface TagRef {
    id: string;
    name: string;
}
export interface TagRename {
    id: string;
    from: string;
    to: string;
}
export interface TagReconcile {
    id: string;
    name: string;
    oldId: string;
}
export type TagResolutionFailureKind = 'rename-drift' | 'name-collision' | 'invalid-name' | 'invalid-id' | 'permission-denied';
export type TagResolutionFailure = {
    kind: TagResolutionFailureKind;
    sourceId?: string;
    name?: string;
    missingScope?: 'tag:create' | 'tag:update';
    existingTagId?: string;
    existingName?: string;
};
export interface TagImportRequest {
    requirements: PackageTagRequirement[] | undefined;
    missingMode: TagMissingMode;
    conflictPolicy: TagConflictPolicy;
}
export interface TagImportPlan {
    matched: TagRef[];
    creations: TagRef[];
    renames: TagRename[];
    reconciles: TagReconcile[];
    dropped: TagRef[];
    failures: TagResolutionFailure[];
}
export type ReferencingWorkflow = Pick<PreparedWorkflow, 'sourceWorkflowId' | 'tagIds'>;
export declare function droppedTagIds(plan: TagImportPlan): ReadonlySet<string>;
export declare function contestedReconcileTargetFailures(plans: TagImportPlan[]): TagResolutionFailure[];
