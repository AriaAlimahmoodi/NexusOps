import { EventService, type WorkflowMutationHooks } from '@n8n/backend-services';
import { Logger } from '@n8n/backend-common';
import { DbLockService, WorkflowReviewActivityRepository, WorkflowReviewLifecycleRepository, WorkflowReviewRequestRepository, WorkflowReviewRequestWorkflowRepository } from '@n8n/db';
import { WorkflowReviewStateNotifier } from './workflow-review-state-notifier.service';
export declare class WorkflowReviewLifecycleService implements WorkflowMutationHooks {
    private readonly logger;
    private readonly workflowReviewRequestRepository;
    private readonly workflowReviewLifecycleRepository;
    private readonly workflowReviewRequestWorkflowRepository;
    private readonly activityRepository;
    private readonly dbLockService;
    private readonly stateNotifier;
    private readonly eventService;
    private readonly pendingDeleteCaptures;
    constructor(logger: Logger, workflowReviewRequestRepository: WorkflowReviewRequestRepository, workflowReviewLifecycleRepository: WorkflowReviewLifecycleRepository, workflowReviewRequestWorkflowRepository: WorkflowReviewRequestWorkflowRepository, activityRepository: WorkflowReviewActivityRepository, dbLockService: DbLockService, stateNotifier: WorkflowReviewStateNotifier, eventService: EventService);
    afterWorkflowArchived(workflowId: string, userId: string | null): Promise<void>;
    afterWorkflowsTransferred(workflowIds: string[], userId: string | null): Promise<void>;
    beforeWorkflowDeleted(workflowId: string, userId: string | null): Promise<void>;
    afterWorkflowsDeleted(workflowIds: string[]): Promise<void>;
    afterWorkflowPublished(event: {
        workflowId: string;
        versionId: string;
        userId: string;
    }): Promise<void>;
    private reconcileUnreviewableOpenRequests;
    private recordCauseEventsAndApplyClosePolicy;
    private recordCapturedDeletions;
    private recordCauseEventsAndClose;
    private closeUnreviewable;
}
