import type { AgentPersonalisation } from '@n8n/api-types';
import type { Agent } from '../entities/agent.entity';
export interface AgentRef {
    id: string;
    name: string;
    personalisation?: AgentPersonalisation;
}
export declare function toAgentRef(agent: Pick<Agent, 'id' | 'name' | 'activeVersion'>, schema?: {
    personalisation?: AgentPersonalisation;
} | null | undefined): AgentRef;
