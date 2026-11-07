import type { ToolDescriptor } from '@n8n/agents';
import type { AgentIntegrationConfig, AgentSkill, StoredAgentConfig } from '@n8n/api-types';
import { Project, WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { AgentHistory } from './agent-history.entity';
export type AgentScope = 'project' | 'instance';
export type ProjectScoped<T extends Pick<Agent, 'projectId'>> = T & {
    projectId: string;
};
export type ProjectAgent = ProjectScoped<Agent>;
export declare function isProjectAgent<T extends Pick<Agent, 'projectId'>>(agent: T): agent is ProjectScoped<T>;
export declare class Agent extends WithTimestampsAndStringId {
    name: string;
    project: Project | null;
    projectId: string | null;
    scope: AgentScope;
    schema: StoredAgentConfig | null;
    integrations: AgentIntegrationConfig[];
    tools: Record<string, {
        code: string;
        descriptor: ToolDescriptor;
    }>;
    skills: Record<string, AgentSkill>;
    availableInMCP: boolean;
    setupCompletedAt: Date | null;
    versionId: string | null;
    activeVersionId: string | null;
    activeVersion?: Relation<AgentHistory> | null;
    revision: number;
}
