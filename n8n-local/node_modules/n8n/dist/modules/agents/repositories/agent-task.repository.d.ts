import type { AgentTaskConfig } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentTask } from '../entities/agent-task.entity';
export declare class AgentTaskRepository extends BaseRepository<AgentTask> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    findByAgentId(agentId: string, ctx?: OperationContext): Promise<AgentTask[]>;
    findByIdAndAgentId(id: string, agentId: string): Promise<AgentTask | null>;
    saveDefinitions(tasks: AgentTask[], ctx: OperationContext): Promise<AgentTask[]>;
    deleteForAgent(agentId: string, ids: string[], ctx: OperationContext): Promise<void>;
    replaceForAgent(agentId: string, definitions: ReadonlyMap<string, AgentTaskConfig>, ctx: OperationContext): Promise<boolean>;
}
