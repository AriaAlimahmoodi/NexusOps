import type { AgentIntegrationConfig, AgentJsonConfig } from '@n8n/api-types';
export { sanitizeAgentToolName as sanitizeToolName } from '@n8n/api-types';
import { type AgentSkillRefs } from './agent-document';
import type { Agent } from '../entities/agent.entity';
export declare function composeJsonConfig(agent: Pick<Agent, 'schema' | 'integrations'>, skillRefs: AgentSkillRefs): AgentJsonConfig | null;
export declare function decomposeJsonConfig(config: AgentJsonConfig): {
    schemaConfig: Omit<AgentJsonConfig, 'integrations'>;
    integrations: AgentIntegrationConfig[];
};
