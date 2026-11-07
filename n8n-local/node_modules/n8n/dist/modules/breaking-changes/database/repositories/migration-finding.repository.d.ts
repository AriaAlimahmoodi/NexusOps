import { type BreakingChangeVersion, type MigrationFindingListedStatus, type MigrationFindingStatus, type MigrationFindingTriageStatus } from '@n8n/api-types';
import { BaseRepository, type OperationContext, TransactionRunner, type WorkflowEntity } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { MigrationFinding, type MigrationFindingId } from '../entities/migration-finding.entity';
export type NewMigrationFinding = Pick<MigrationFinding, 'targetVersion' | 'ruleId' | 'workflowId'>;
export type TriageableMigrationFinding = Pick<MigrationFinding, 'id' | 'ruleId' | 'workflowId' | 'notifiedAt'> & {
    status: MigrationFindingListedStatus;
    workflow: Pick<WorkflowEntity, 'id' | 'name' | 'activeVersionId' | 'updatedAt'>;
};
export interface RuleFindingCount {
    ruleId: string;
    count: number;
}
export declare class MigrationFindingRepository extends BaseRepository<MigrationFinding> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    listForWorkflows(targetVersion: BreakingChangeVersion, workflowIds: string[], ctx: OperationContext): Promise<MigrationFinding[]>;
    countUnresolvedByRule(targetVersion: BreakingChangeVersion, workflowIds: string[] | undefined, ctx: OperationContext): Promise<RuleFindingCount[]>;
    countWontFixByRule(targetVersion: BreakingChangeVersion, workflowIds: string[] | undefined, ctx: OperationContext): Promise<RuleFindingCount[]>;
    countDistinctUnresolvedWorkflows(targetVersion: BreakingChangeVersion, workflowIds: string[] | undefined, ctx: OperationContext): Promise<number>;
    listWorkflowIdsWithUnresolvedFindings(targetVersion: BreakingChangeVersion, workflowIds: string[], ctx: OperationContext): Promise<string[]>;
    listTriageableForRule(targetVersion: BreakingChangeVersion, ruleId: string, workflowIds: string[] | undefined, ctx: OperationContext): Promise<TriageableMigrationFinding[]>;
    setTriageStatus(targetVersion: BreakingChangeVersion, ruleId: string, workflowId: string, status: MigrationFindingTriageStatus, ctx: OperationContext): Promise<boolean>;
    setTriageStatusForWorkflows(targetVersion: BreakingChangeVersion, ruleId: string, workflowIds: string[], status: MigrationFindingTriageStatus, ctx: OperationContext): Promise<void>;
    insertMany(findings: NewMigrationFinding[], ctx: OperationContext): Promise<void>;
    updateStatusForIds(ids: MigrationFindingId[], status: MigrationFindingStatus, note: string | undefined, ctx: OperationContext): Promise<void>;
    private countByRuleWithStatus;
    private transitionStatus;
    markFixedForIds(ids: MigrationFindingId[], ctx: OperationContext): Promise<void>;
    markNotifiedForIds(ids: MigrationFindingId[], ctx: OperationContext): Promise<void>;
}
