import { WithTimestamps } from '@n8n/db';
import { Agent } from './agent.entity';
export declare class AgentCheckpoint extends WithTimestamps {
    runId: string;
    agent: Agent | null;
    agentId: string | null;
    threadId: string | null;
    state: string | null;
    expired: boolean;
}
