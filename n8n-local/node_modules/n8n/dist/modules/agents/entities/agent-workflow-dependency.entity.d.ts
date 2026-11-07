import { type WorkflowEntity, WithCreatedAt } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { Agent } from './agent.entity';
export declare class AgentWorkflowDependency extends WithCreatedAt {
    agentId: string;
    agent: Relation<Agent>;
    workflowId: string;
    workflow: Relation<WorkflowEntity>;
}
