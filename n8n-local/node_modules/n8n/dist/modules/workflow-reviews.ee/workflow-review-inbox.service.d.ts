import type { InboxCounts, InboxWorkflowReviewItem, WorkflowReviewRequestDetail } from '@n8n/api-types';
import { WorkflowReviewInboxRepository, WorkflowReviewRequestWorkflowRepository, type User } from '@n8n/db';
import type { InboxSourceQuery } from '../inbox/inbox-source.registry';
import { WorkflowHistoryService } from '../../workflows/workflow-history/workflow-history.service';
import { WorkflowReviewAuthorizationService } from './workflow-review-authorization.service';
import { WorkflowReviewFeatureGate } from './workflow-review-feature-gate.service';
import { WorkflowReviewParticipantResolver } from './workflow-review-participant.resolver';
export declare class WorkflowReviewInboxService {
    private readonly featureGate;
    private readonly authorizationService;
    private readonly workflowHistoryService;
    private readonly workflowReviewInboxRepository;
    private readonly workflowReviewRequestWorkflowRepository;
    private readonly participantResolver;
    constructor(featureGate: WorkflowReviewFeatureGate, authorizationService: WorkflowReviewAuthorizationService, workflowHistoryService: WorkflowHistoryService, workflowReviewInboxRepository: WorkflowReviewInboxRepository, workflowReviewRequestWorkflowRepository: WorkflowReviewRequestWorkflowRepository, participantResolver: WorkflowReviewParticipantResolver);
    isInboxAvailable(): Promise<boolean>;
    listForInbox(user: User, query: InboxSourceQuery): Promise<InboxWorkflowReviewItem[]>;
    getInboxSummaryForUser(user: User): Promise<InboxCounts>;
    getDetail(user: User, workflowReviewRequestId: string): Promise<WorkflowReviewRequestDetail>;
    private toWorkflowDetail;
    private findVersionSnapshot;
    private toVersionSnapshot;
    private toReviewSummary;
    private toInboxItem;
}
