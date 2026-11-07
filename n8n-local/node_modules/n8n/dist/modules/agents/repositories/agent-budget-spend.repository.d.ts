import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentBudgetSpend } from '../entities/agent-budget-spend.entity';
export interface AgentBudgetSpendEntry {
    key: string;
    usd: number;
}
export interface AgentBudgetSpendTotal {
    key: string;
    totalUsd: number;
    previousUsd: number;
}
export declare function previousTotalUsd(totalUsd: number, usd: number): number;
export declare class AgentBudgetSpendRepository extends BaseRepository<AgentBudgetSpend> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    readTotal(key: string): Promise<number>;
    applySpend(callId: string, entries: AgentBudgetSpendEntry[]): Promise<AgentBudgetSpendTotal[]>;
    private insertAppliedCall;
    private incrementKeys;
    private readTotalsWith;
    private execute;
    private tableName;
    private quote;
    private isPostgres;
}
