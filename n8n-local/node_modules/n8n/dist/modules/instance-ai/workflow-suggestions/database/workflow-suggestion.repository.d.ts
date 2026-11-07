import type { WorkflowSuggestionContent, WorkflowSuggestionBaseline, WorkflowSuggestionActivity as WorkflowSuggestionActivityDto, WorkflowSuggestionAppliedVersion } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { WorkflowSuggestionActivity } from './workflow-suggestion-activity.entity';
import { WorkflowSuggestion } from './workflow-suggestion.entity';
export declare class WorkflowSuggestionRepository extends BaseRepository<WorkflowSuggestion> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    getSuggestion(id: string, scope: Pick<WorkflowSuggestion, 'workflowId' | 'projectId'>, ctx?: OperationContext): Promise<WorkflowSuggestion>;
    createPending(baseline: WorkflowSuggestionBaseline, payload: WorkflowSuggestionContent, ctx: OperationContext, resultKind: WorkflowSuggestion['resultKind']): Promise<WorkflowSuggestion>;
    appendSubmittedActivity(suggestionId: string, ctx: OperationContext): Promise<void>;
    appendActivity(suggestionId: string, action: WorkflowSuggestionActivityDto['action'], actor: Pick<WorkflowSuggestionActivityDto, 'author' | 'actorId'>, ctx: OperationContext): Promise<void>;
    closePending(suggestion: WorkflowSuggestion, reason: NonNullable<WorkflowSuggestion['closedReason']>, actor: Pick<WorkflowSuggestionActivityDto, 'author' | 'actorId'>, ctx: OperationContext, appliedVersion?: WorkflowSuggestionAppliedVersion | null): Promise<boolean>;
    getPendingForWorkflow(workflowId: string, ctx?: OperationContext): Promise<WorkflowSuggestion | null>;
    getActivity(suggestionId: string): Promise<WorkflowSuggestionActivity[]>;
}
