import { CreateWorkflowReviewCommentDto, CreateWorkflowReviewRequestDto, DecideWorkflowReviewRequestDto, GetWorkflowReviewEligibleReviewersQueryDto, ListWorkflowReviewActivityQueryDto, ListWorkflowReviewRequestsQueryDto, UpdateWorkflowReviewRequestVersionDto, type ListWorkflowReviewActivityResponse, type WorkflowReviewActivityEntry, type WorkflowReviewRequestDetail } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { WorkflowReviewActivityService } from './workflow-review-activity.service';
import { WorkflowReviewInboxService } from './workflow-review-inbox.service';
import { WorkflowReviewRequestDecisionService } from './workflow-review-request-decision.service';
import { WorkflowReviewRequestStatusService } from './workflow-review-request-status.service';
import { WorkflowReviewRequestSubmissionService } from './workflow-review-request-submission.service';
export declare class WorkflowReviewRequestsController {
    private readonly workflowReviewRequestStatusService;
    private readonly workflowReviewRequestSubmissionService;
    private readonly workflowReviewRequestDecisionService;
    private readonly workflowReviewInboxService;
    private readonly workflowReviewActivityService;
    constructor(workflowReviewRequestStatusService: WorkflowReviewRequestStatusService, workflowReviewRequestSubmissionService: WorkflowReviewRequestSubmissionService, workflowReviewRequestDecisionService: WorkflowReviewRequestDecisionService, workflowReviewInboxService: WorkflowReviewInboxService, workflowReviewActivityService: WorkflowReviewActivityService);
    list(req: AuthenticatedRequest, _res: Response, query: ListWorkflowReviewRequestsQueryDto): Promise<import("@n8n/api-types").WorkflowReviewRequestList>;
    getEligibleReviewers(req: AuthenticatedRequest, _res: Response, query: GetWorkflowReviewEligibleReviewersQueryDto): Promise<import("@n8n/api-types").WorkflowReviewEligibleReviewersList>;
    create(req: AuthenticatedRequest, res: Response, dto: CreateWorkflowReviewRequestDto): Promise<import("@n8n/api-types").WorkflowReviewRequestSummary>;
    updateVersion(req: AuthenticatedRequest, _res: Response, workflowReviewRequestId: string, dto: UpdateWorkflowReviewRequestVersionDto): Promise<import("@n8n/api-types").WorkflowReviewRequestSummary>;
    decide(req: AuthenticatedRequest, _res: Response, workflowReviewRequestId: string, dto: DecideWorkflowReviewRequestDto): Promise<import("@n8n/api-types").DecideWorkflowReviewRequestResponse>;
    listActivity(req: AuthenticatedRequest, _res: Response, workflowReviewRequestId: string, query: ListWorkflowReviewActivityQueryDto): Promise<ListWorkflowReviewActivityResponse>;
    createComment(req: AuthenticatedRequest, res: Response, workflowReviewRequestId: string, dto: CreateWorkflowReviewCommentDto): Promise<WorkflowReviewActivityEntry>;
    getDetail(req: AuthenticatedRequest, _res: Response, workflowReviewRequestId: string): Promise<WorkflowReviewRequestDetail>;
}
