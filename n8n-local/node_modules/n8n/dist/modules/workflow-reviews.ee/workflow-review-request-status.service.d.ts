import type { ListWorkflowReviewRequestsQueryDto, WorkflowReviewRequestList } from '@n8n/api-types';
import { UserRepository, WorkflowReviewRequestRepository, type User } from '@n8n/db';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { WorkflowReviewAuthorizationService } from './workflow-review-authorization.service';
import { WorkflowReviewFeatureGate } from './workflow-review-feature-gate.service';
export declare class WorkflowReviewRequestStatusService {
    private readonly featureGate;
    private readonly workflowFinderService;
    private readonly workflowReviewRequestRepository;
    private readonly userRepository;
    private readonly authorizationService;
    constructor(featureGate: WorkflowReviewFeatureGate, workflowFinderService: WorkflowFinderService, workflowReviewRequestRepository: WorkflowReviewRequestRepository, userRepository: UserRepository, authorizationService: WorkflowReviewAuthorizationService);
    list(user: User, query: ListWorkflowReviewRequestsQueryDto): Promise<WorkflowReviewRequestList>;
    private toWorkflowScopedItems;
    private resolveDecisionActors;
    private pickDecisionActor;
}
