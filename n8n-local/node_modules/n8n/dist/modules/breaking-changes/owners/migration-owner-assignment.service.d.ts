import type { BreakingChangeWorkflowOwner, MigrationOwnerCandidate } from '@n8n/api-types';
import { WorkflowSharingService } from '@n8n/backend-services';
import { UserRepository, WorkflowRepository, type User } from '@n8n/db';
import { MigrationWorkflowOwnerRepository } from '../database/repositories/migration-workflow-owner.repository';
import { MigrationOwnerSuggestionService } from './migration-owner-suggestion.service';
export declare class MigrationOwnerAssignmentService {
    private readonly workflowRepository;
    private readonly userRepository;
    private readonly ownerRepository;
    private readonly suggestionService;
    private readonly workflowSharingService;
    constructor(workflowRepository: WorkflowRepository, userRepository: UserRepository, ownerRepository: MigrationWorkflowOwnerRepository, suggestionService: MigrationOwnerSuggestionService, workflowSharingService: WorkflowSharingService);
    assign(workflowId: string, userId: string, assignedBy: User): Promise<BreakingChangeWorkflowOwner>;
    candidates(workflowId: string): Promise<MigrationOwnerCandidate[]>;
    unassign(workflowId: string): Promise<BreakingChangeWorkflowOwner | null>;
    private ensureWorkflowExists;
    private findUser;
}
