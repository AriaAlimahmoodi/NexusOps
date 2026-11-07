import type { WorkflowSuggestionBaseline, WorkflowSuggestionContent, WorkflowSuggestionGraph, WorkflowSuggestionProposalDetail } from '@n8n/api-types';
import { SharedWorkflowRepository, TransactionRunner, UserRepository, WorkflowRepository, WorkflowPublishHistoryRepository } from '@n8n/db';
import type { OperationContext, User, WorkflowEntity } from '@n8n/db';
import { WorkflowPublicationStatusService } from '../../../workflows/publication/workflow-publication-status.service';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import { WorkflowSuggestionRepository } from './database/workflow-suggestion.repository';
import type { WorkflowSuggestion } from './database/workflow-suggestion.entity';
export type PreparedWorkflowSuggestion = {
    baseline: WorkflowSuggestionBaseline;
    payload: WorkflowSuggestionContent;
    resultKind: WorkflowSuggestion['resultKind'];
};
type WorkflowSuggestionTarget = {
    workflow: WorkflowEntity | null;
    projectId: string | undefined;
    latestPublishHistoryEventId: number | null;
};
export declare class WorkflowSuggestionService {
    private readonly suggestions;
    private readonly users;
    private readonly publication;
    private readonly txRunner;
    private readonly workflowFinder;
    private readonly workflowRepository;
    private readonly sharedWorkflowRepository;
    private readonly workflowPublishHistoryRepository;
    constructor(suggestions: WorkflowSuggestionRepository, users: UserRepository, publication: WorkflowPublicationStatusService, txRunner: TransactionRunner, workflowFinder: WorkflowFinderService, workflowRepository: WorkflowRepository, sharedWorkflowRepository: SharedWorkflowRepository, workflowPublishHistoryRepository: WorkflowPublishHistoryRepository);
    requireEditor(userId: string, workflowId: string, ctx?: OperationContext): Promise<User>;
    private getEditorContext;
    private isPublished;
    captureBaseline(workflowId: string, backgroundUserId: string): Promise<WorkflowSuggestionBaseline>;
    prepareSuggestion(baseline: WorkflowSuggestionBaseline, input: {
        graph: WorkflowSuggestionGraph;
        explanation: string;
        errorContext?: WorkflowSuggestionContent['errorContext'];
        resultKind: 'fix_ready' | 'needs_you';
    }): Promise<PreparedWorkflowSuggestion>;
    private readWorkflowTarget;
    readWorkflowTargetForApply(workflowId: string, ctx: OperationContext): Promise<WorkflowSuggestionTarget>;
    createSuggestion(prepared: PreparedWorkflowSuggestion, ctx?: OperationContext): Promise<WorkflowSuggestion>;
    matchesBaseline(baseline: Pick<WorkflowSuggestionBaseline, 'projectId' | 'expectedBaseline'>, { workflow, projectId, latestPublishHistoryEventId }: WorkflowSuggestionTarget): Promise<boolean>;
    reconcilePending(suggestionId: string, scope: {
        workflowId: string;
        projectId: string;
    }, ctx?: OperationContext): Promise<{
        suggestion: WorkflowSuggestion;
        target: WorkflowSuggestionTarget;
    }>;
    private closeIfOutdated;
    reconcileWorkflow(workflowId: string): Promise<void>;
    private requireProposalAccess;
    getProposal(viewer: User, projectId: string, workflowId: string, suggestionId: string): Promise<WorkflowSuggestionProposalDetail>;
}
export {};
