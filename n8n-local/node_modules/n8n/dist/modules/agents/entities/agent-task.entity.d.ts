import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { Agent } from './agent.entity';
export declare class AgentTask extends WithTimestamps {
    id: string;
    agentId: string;
    agent: Relation<Agent>;
    name: string;
    objective: string;
    cronExpression: string;
    timezone: string | null;
}
