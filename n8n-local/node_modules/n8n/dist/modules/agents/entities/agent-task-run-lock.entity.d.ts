import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { Agent } from './agent.entity';
export declare class AgentTaskRunLock extends WithTimestamps {
    agentId: string;
    agent: Relation<Agent>;
    taskId: string;
    holderId: string;
    heldUntil: Date;
}
