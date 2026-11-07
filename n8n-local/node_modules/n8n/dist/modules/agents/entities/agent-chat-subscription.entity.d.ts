import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { Agent } from './agent.entity';
export declare class AgentChatSubscription extends WithTimestamps {
    agentId: string;
    agent: Relation<Agent>;
    integrationType: string;
    credentialId: string;
    threadId: string;
}
