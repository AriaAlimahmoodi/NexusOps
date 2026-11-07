import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentWorkflowDependency } from '../entities/agent-workflow-dependency.entity';
export type AgentWorkflowDependencyReference = Pick<AgentWorkflowDependency, 'agentId' | 'workflowId'>;
export declare class AgentWorkflowDependencyRepository extends BaseRepository<AgentWorkflowDependency> {
    private readonly txRunner;
    constructor(dataSource: DataSource, txRunner: TransactionRunner);
    refreshForAgent(agentId: string): Promise<void>;
    removeForAgent(agentId: string): Promise<void>;
    findByWorkflowIds(workflowIds: string[]): Promise<AgentWorkflowDependencyReference[]>;
    private resolveWorkflowIds;
    private lockWorkflows;
}
