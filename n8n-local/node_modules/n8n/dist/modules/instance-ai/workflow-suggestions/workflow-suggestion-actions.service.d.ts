import type { WorkflowSuggestionActionResult } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { TransactionRunner, type OperationContext, type User } from '@n8n/db';
import { CollaborationService } from '../../../collaboration/collaboration.service';
import { WorkflowPublicationStatusService } from '../../../workflows/publication/workflow-publication-status.service';
import { WorkflowService } from '../../../workflows/workflow.service';
import { WorkflowSuggestionRepository } from './database/workflow-suggestion.repository';
import { WorkflowSuggestionService } from './workflow-suggestion.service';
export declare class WorkflowSuggestionActionsService {
    private readonly service;
    private readonly suggestions;
    private readonly workflows;
    private readonly collaboration;
    private readonly publication;
    private readonly txRunner;
    private readonly logger;
    constructor(service: WorkflowSuggestionService, suggestions: WorkflowSuggestionRepository, workflows: WorkflowService, collaboration: CollaborationService, publication: WorkflowPublicationStatusService, txRunner: TransactionRunner, logger: Logger);
    apply(actor: User, projectId: string, workflowId: string, suggestionId: string, clientId?: string): Promise<WorkflowSuggestionActionResult>;
    approveAndPublish(actor: User, projectId: string, workflowId: string, suggestionId: string, clientId?: string): Promise<WorkflowSuggestionActionResult>;
    discard(actor: User, projectId: string, workflowId: string, suggestionId: string): Promise<WorkflowSuggestionActionResult>;
    discardPending(actor: User, projectId: string, workflowId: string, suggestionId: string, ctx?: OperationContext): Promise<'discarded' | 'already_closed' | 'unavailable'>;
    private applySuggestion;
    private validatePreparedWorkflow;
    private publishAppliedVersion;
    private notifyEditors;
}
