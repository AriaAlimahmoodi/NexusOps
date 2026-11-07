import { ActivityEventRepository, ProjectRelationRepository, SharedWorkflowRepository, UserRepository, WorkflowHistoryRepository, WorkflowPublishHistoryRepository } from '@n8n/db';
import type { OwnerSuggestion } from '../database/repositories/migration-workflow-owner.repository';
export declare const RECENT_ACTIONS_PER_WORKFLOW = 10;
export declare class MigrationOwnerSuggestionService {
    private readonly activityEventRepository;
    private readonly workflowPublishHistoryRepository;
    private readonly workflowHistoryRepository;
    private readonly sharedWorkflowRepository;
    private readonly projectRelationRepository;
    private readonly userRepository;
    constructor(activityEventRepository: ActivityEventRepository, workflowPublishHistoryRepository: WorkflowPublishHistoryRepository, workflowHistoryRepository: WorkflowHistoryRepository, sharedWorkflowRepository: SharedWorkflowRepository, projectRelationRepository: ProjectRelationRepository, userRepository: UserRepository);
    suggestOwners(workflowIds: string[]): Promise<OwnerSuggestion[]>;
    private loadEligibleUsers;
    private findLatestAttributedActivity;
    private findProjectOwners;
}
