import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { UserError, type JsonObject } from 'n8n-workflow';
import { AgentPlanHistory } from '../entities/agent-plan-history.entity';
import { AgentPlan } from '../entities/agent-plan.entity';
export type AgentPlanRecord = Pick<AgentPlan, 'id' | 'threadId' | 'revision' | 'formatVersion' | 'data' | 'closedAt' | 'createdAt' | 'updatedAt'>;
export type AgentPlanRevision = Pick<AgentPlanHistory, 'planId' | 'revision' | 'formatVersion' | 'data' | 'closedAt' | 'createdAt'>;
export type AgentPlanRevisionMetadata = Omit<AgentPlanRevision, 'planId' | 'data'>;
type PlanWrite = {
    threadId: string;
    planId: string;
    expectedRevision: number;
};
type PlanDocument = {
    formatVersion: number;
    data: JsonObject;
};
export declare class AgentPlanWriteConflictError extends UserError {
    constructor();
}
export declare class AgentPlanRepository extends BaseRepository<AgentPlan> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    createActivePlan(input: PlanDocument & {
        id: string;
        threadId: string;
    }, ctx: OperationContext): Promise<AgentPlanRecord>;
    findActivePlan(threadId: string, ctx: OperationContext): Promise<AgentPlanRecord | null>;
    findPlan(threadId: string, planId: string, ctx: OperationContext): Promise<AgentPlanRecord | null>;
    findRevision(threadId: string, planId: string, revision: number, ctx: OperationContext): Promise<AgentPlanRevision | null>;
    listHistory(threadId: string, planId: string, options: {
        afterRevision?: number;
        limit?: number;
    }, ctx: OperationContext): Promise<{
        items: AgentPlanRevisionMetadata[];
        nextCursor: number | null;
    }>;
    replacePlan(input: PlanWrite & PlanDocument, ctx: OperationContext): Promise<AgentPlanRecord>;
    closePlan(input: PlanWrite, ctx: OperationContext): Promise<AgentPlanRecord>;
    private writeRevision;
    private insertSnapshot;
    private validateVersion;
    private serializeData;
}
export {};
