import { type AgentSkill, type StoredAgentConfig } from '@n8n/api-types';
import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { Agent } from './agent.entity';
export declare class AgentHistory extends WithTimestamps {
    versionId: string;
    agentId: string;
    agent: Relation<Agent>;
    schema: StoredAgentConfig | null;
    tools: Agent['tools'] | null;
    skills: Record<string, AgentSkill> | null;
    publishedById: string | null;
    author: string;
}
