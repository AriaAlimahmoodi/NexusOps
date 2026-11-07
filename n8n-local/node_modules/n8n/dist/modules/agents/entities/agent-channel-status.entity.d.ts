import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { Agent } from './agent.entity';
export type AgentChannelStatusValue = 'connected' | 'error';
export declare class AgentChannelStatus extends WithTimestamps {
    agentId: string;
    agent: Relation<Agent>;
    integrationType: string;
    credentialId: string;
    hostId: string;
    status: AgentChannelStatusValue;
    errorMessage: string | null;
    attempts: number;
    backoffUntil: Date | null;
    expiresAt: Date | null;
}
