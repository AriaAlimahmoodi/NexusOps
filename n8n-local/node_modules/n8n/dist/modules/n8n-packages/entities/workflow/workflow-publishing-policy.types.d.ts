export declare const WorkflowPublishingPolicy: {
    readonly PreservePublishedState: 'preserve-published-state';
    readonly MatchSource: 'match-source';
    readonly PublishAll: 'publish-all';
    readonly UnpublishAll: 'unpublish-all';
};
export type WorkflowPublishingPolicy = (typeof WorkflowPublishingPolicy)[keyof typeof WorkflowPublishingPolicy];
export type PublishingAction = 'publish' | 'unpublish' | 'noop';
export type WorkflowPublishingOutcomeState = 'published' | 'unpublished' | 'unchanged' | 'blocked' | 'failed';
export type WorkflowPublishingBlockedReason = 'stub-credential' | 'incomplete-credential' | 'missing-node-type';
export interface WorkflowPublishingOutcome {
    state: WorkflowPublishingOutcomeState;
    error?: string;
    blockedReason?: WorkflowPublishingBlockedReason;
    skippedPublishReason?: WorkflowPublishingBlockedReason;
}
export interface WorkflowPublishingContext {
    status: 'created' | 'updated' | 'skipped';
    sourcePublished?: boolean;
    currentlyPublished: boolean;
    isArchived: boolean;
}
