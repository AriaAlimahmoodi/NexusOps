import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { MigrationWorkflowOwner } from '../entities/migration-workflow-owner.entity';
export interface OwnerSuggestion {
    workflowId: string;
    userId: string;
}
export declare class MigrationWorkflowOwnerRepository extends BaseRepository<MigrationWorkflowOwner> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findByWorkflowIds(workflowIds: string[], ctx: OperationContext): Promise<MigrationWorkflowOwner[]>;
    assign(workflowId: string, userId: string, assignedById: string, ctx: OperationContext): Promise<void>;
    resetToSuggestion(workflowId: string, suggestedUserId: string | undefined, ctx: OperationContext): Promise<void>;
    replaceSuggestions(workflowIds: string[], suggestions: OwnerSuggestion[], ctx: OperationContext): Promise<void>;
}
