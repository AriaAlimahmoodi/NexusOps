export type PublicationOutcomeResult = 'published' | 'unpublished' | 'skipped' | 'partial_success' | 'failed';
export type PublicationOutcomeReason = 'none' | 'workflow_not_found' | 'version_missing';
export type PublicationTriggerOperation = 'activate' | 'deactivate';
export type PublicationOperationResult = 'success' | 'failure';
export type WorkflowPublicationMetricsEventMap = {
    'workflow-publication-outbox-record-processed': {
        result: PublicationOutcomeResult;
        reason: PublicationOutcomeReason;
        durationMs: number;
    };
    'workflow-publication-trigger-operation': {
        operation: PublicationTriggerOperation;
        result: PublicationOperationResult;
        durationMs: number;
    };
    'workflow-publication-trigger-node-operations': {
        operation: PublicationTriggerOperation;
        result: PublicationOperationResult;
        count: number;
    };
    'workflow-publication-outbox-cleanup': {
        result: PublicationOperationResult;
        deletedCount: number;
        durationMs: number;
    };
    'workflow-publication-reconciliation': {
        result: PublicationOperationResult;
        deficientCount: number;
        surplusCount: number;
        versionSkewCount: number;
        statusDriftCount: number;
        unreportedCount: number;
        durationMs: number;
    };
    'workflow-publication-ghost-trigger-sweep': {
        removedCount: number;
    };
};
