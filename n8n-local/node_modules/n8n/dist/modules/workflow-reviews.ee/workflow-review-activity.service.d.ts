import type { CreateWorkflowReviewCommentDto, ListWorkflowReviewActivityQueryDto, ListWorkflowReviewActivityResponse, WorkflowReviewActivityEntry } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { TransactionRunner, UserRepository, WorkflowReviewActivityCommentRepository, WorkflowReviewActivityRepository, WorkflowReviewRequestRepository, type User } from '@n8n/db';
import { WorkflowReviewAuthorizationService } from './workflow-review-authorization.service';
import { WorkflowReviewFeatureGate } from './workflow-review-feature-gate.service';
export declare class WorkflowReviewActivityService {
    private readonly featureGate;
    private readonly authorizationService;
    private readonly activityRepository;
    private readonly activityCommentRepository;
    private readonly requestRepository;
    private readonly userRepository;
    private readonly txRunner;
    private readonly logger;
    private readonly eventService;
    constructor(featureGate: WorkflowReviewFeatureGate, authorizationService: WorkflowReviewAuthorizationService, activityRepository: WorkflowReviewActivityRepository, activityCommentRepository: WorkflowReviewActivityCommentRepository, requestRepository: WorkflowReviewRequestRepository, userRepository: UserRepository, txRunner: TransactionRunner, logger: Logger, eventService: EventService);
    listActivity(user: User, workflowReviewRequestId: string, query: ListWorkflowReviewActivityQueryDto): Promise<ListWorkflowReviewActivityResponse>;
    createComment(user: User, workflowReviewRequestId: string, dto: CreateWorkflowReviewCommentDto): Promise<WorkflowReviewActivityEntry>;
    private hydrate;
    private hydrateAuthors;
    private encodeCursor;
    private decodeCursor;
}
