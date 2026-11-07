import { type ExecutionOptions, type RunOptions, type SpendEntry, type SpendLedger, type SpendTotal } from '@n8n/agents';
import { type AgentBudgetNotice, type BudgetGuardrailConfig } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { AgentBudgetSpendRepository } from './repositories/agent-budget-spend.repository';
export declare class AgentSpendLedger implements SpendLedger {
    private readonly budgetSpendRepository;
    private readonly logger;
    private readonly pending;
    constructor(budgetSpendRepository: AgentBudgetSpendRepository, logger: Logger);
    add(callId: string, entries: SpendEntry[]): Promise<SpendTotal[]>;
    read(key: string): Promise<number>;
    private flushPending;
    private buffer;
    private bufferedTotals;
    private bufferedTotalFor;
}
export interface BudgetAttachInput {
    ledger?: SpendLedger;
    budget?: BudgetGuardrailConfig;
    sessionId?: string;
    agentId?: string;
    alertAgentId?: string;
    rootSessionCapUsd?: number;
    useRootSessionCap?: boolean;
    onNotice?: (notice: AgentBudgetNotice) => void;
}
export declare function withBudgetGuardrail<T extends RunOptions & ExecutionOptions>(options: T, input: BudgetAttachInput): T;
