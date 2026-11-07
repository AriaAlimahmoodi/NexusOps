import type { InboxCounts, InboxState } from '@n8n/api-types';
import { BaseRepository, SharedWorkflowRepository, TransactionRunner, type OperationContext, type User } from '@n8n/db';
import type { Scope } from '@n8n/permissions';
import { DataSource } from '@n8n/typeorm';
import { SelfHealingResult } from './self-healing-result.entity';
export type CreateSelfHealingResult = Pick<SelfHealingResult, 'workflowId' | 'projectId' | 'backgroundUserId' | 'outcome' | 'summary' | 'report' | 'completedAt' | 'executionId' | 'suggestionId' | 'usage'>;
export type SelfHealingInboxAccess = {
    user: User;
    globalScopes: Scope[];
    projectRoles: string[];
    workflowRoles: string[];
};
type SelfHealingInboxBoundary = {
    mode: 'beforeTime';
    updatedAt: Date;
} | {
    mode: 'beforeOrAtTime';
    updatedAt: Date;
} | {
    mode: 'afterItem';
    updatedAt: Date;
    id: string;
};
type SelfHealingInboxQuery = {
    state: InboxState;
    limit: number;
    boundary?: SelfHealingInboxBoundary;
};
export declare class SelfHealingResultRepository extends BaseRepository<SelfHealingResult> {
    private readonly sharedWorkflows;
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner, sharedWorkflows: SharedWorkflowRepository);
    private inboxQuery;
    listForInbox(access: SelfHealingInboxAccess, { state, limit, boundary }: SelfHealingInboxQuery): Promise<{
        id: string;
        state: "closed" | "open";
        projectId: string;
        workflowId: string;
        workflowName: string;
        summary: string;
        outcome: "could_not_fix" | "fix_ready" | "needs_you";
        createdAt: Date;
        updatedAt: Date;
        completedAt: Date;
    }[]>;
    countForInbox(access: SelfHealingInboxAccess): Promise<InboxCounts>;
    getResult(id: string, scope: Pick<SelfHealingResult, 'workflowId' | 'projectId'>, ctx?: OperationContext): Promise<SelfHealingResult>;
    createResult(input: CreateSelfHealingResult, ctx: OperationContext): Promise<SelfHealingResult>;
    dismissResult(id: string, userId: string, ctx: OperationContext): Promise<boolean>;
}
export {};
