import type { WorkflowReviewDecisionIneligibilityReason } from '@n8n/api-types';
import { ProjectRelationRepository, ProjectRepository, WorkflowReviewRequestAuthorRepository, WorkflowReviewRequestRepository, WorkflowReviewRequestReviewerRepository, WorkflowReviewRequestWorkflowRepository, type InboxVisibility, type User, type WorkflowReviewRequest, type WorkflowReviewRequestWorkflowDetailRow } from '@n8n/db';
import { ProjectService } from '../../services/project.service.ee';
import { RoleService } from '@n8n/backend-services';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
export interface ReadableWorkflowReviewRequest {
    request: WorkflowReviewRequest;
    workflowRows: WorkflowReviewRequestWorkflowDetailRow[];
    readableWorkflowRows: WorkflowReviewRequestWorkflowDetailRow[];
}
export interface WorkflowReviewViewerEligibility {
    canDecide: boolean;
    decisionIneligibilityReason: WorkflowReviewDecisionIneligibilityReason | null;
    canComment: boolean;
}
export declare class WorkflowReviewAuthorizationService {
    private readonly workflowFinderService;
    private readonly projectService;
    private readonly roleService;
    private readonly projectRepository;
    private readonly projectRelationRepository;
    private readonly workflowReviewRequestRepository;
    private readonly workflowReviewRequestWorkflowRepository;
    private readonly workflowReviewRequestAuthorRepository;
    private readonly workflowReviewRequestReviewerRepository;
    constructor(workflowFinderService: WorkflowFinderService, projectService: ProjectService, roleService: RoleService, projectRepository: ProjectRepository, projectRelationRepository: ProjectRelationRepository, workflowReviewRequestRepository: WorkflowReviewRequestRepository, workflowReviewRequestWorkflowRepository: WorkflowReviewRequestWorkflowRepository, workflowReviewRequestAuthorRepository: WorkflowReviewRequestAuthorRepository, workflowReviewRequestReviewerRepository: WorkflowReviewRequestReviewerRepository);
    isAdminForProject(user: User, projectId: string): Promise<boolean>;
    private isGlobalAdmin;
    private findAdminProjectIds;
    resolveInboxVisibility(user: User): Promise<InboxVisibility>;
    private resolveReadableProjectIds;
    findReadableRequestOrFail(user: User, workflowReviewRequestId: string): Promise<ReadableWorkflowReviewRequest>;
    private canAccessRequest;
    resolveOpenableRequestIds(user: User, requests: Array<{
        id: string;
        projectId: string;
    }>): Promise<Set<string>>;
    private filterReadableWorkflowRows;
    resolveViewerEligibility(user: User, access: Pick<ReadableWorkflowReviewRequest, 'request' | 'workflowRows' | 'readableWorkflowRows'>): Promise<WorkflowReviewViewerEligibility>;
}
