import type { TagReconcile, TagRef, TagRename, TagResolutionFailure, TagResolutionFailureKind } from './tag.types';
import { TagConflictPolicy, TagMissingMode } from '../../n8n-packages.types';
export type TagDecisionFailure = Omit<TagResolutionFailure, 'kind' | 'sourceId' | 'name'> & {
    kind: Exclude<TagResolutionFailureKind, 'permission-denied'>;
    sourceId: string;
    name: string;
};
export type TagEffect = {
    action: 'attach';
    target: TagRef;
} | {
    action: 'create';
    tag: TagRef;
} | {
    action: 'rename';
    rename: TagRename;
} | {
    action: 'reconcile';
    reconcile: TagReconcile;
} | {
    action: 'drop';
    tag: TagRef;
} | {
    action: 'fail';
    failure: TagDecisionFailure;
};
export declare function decideTagImportAction(requirement: TagRef, targetTagWithSameId: TagRef | undefined, nameHolder: TagRef | undefined, missingMode: TagMissingMode, conflictPolicy: TagConflictPolicy): TagEffect;
