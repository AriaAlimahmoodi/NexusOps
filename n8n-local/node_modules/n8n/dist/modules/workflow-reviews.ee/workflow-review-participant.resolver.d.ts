import type { WorkflowReviewEligibleReviewer } from '@n8n/api-types';
import { UserRepository, WorkflowReviewRequestAuthorRepository, WorkflowReviewRequestReviewerRepository, type WorkflowReviewRequest } from '@n8n/db';
export interface WorkflowReviewParticipants {
    requester: WorkflowReviewEligibleReviewer | null;
    authors: WorkflowReviewEligibleReviewer[];
    reviewers: WorkflowReviewEligibleReviewer[];
}
export interface WorkflowReviewParticipantLookup {
    for(requestId: string): WorkflowReviewParticipants;
}
export declare class WorkflowReviewParticipantResolver {
    private readonly workflowReviewRequestReviewerRepository;
    private readonly workflowReviewRequestAuthorRepository;
    private readonly userRepository;
    constructor(workflowReviewRequestReviewerRepository: WorkflowReviewRequestReviewerRepository, workflowReviewRequestAuthorRepository: WorkflowReviewRequestAuthorRepository, userRepository: UserRepository);
    resolve(requests: WorkflowReviewRequest[]): Promise<WorkflowReviewParticipantLookup>;
}
