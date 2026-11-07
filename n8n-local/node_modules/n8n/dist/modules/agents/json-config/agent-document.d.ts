import type { AgentJsonConfig, AgentJsonSkillConfig, StoredAgentConfig } from '@n8n/api-types';
export type AgentSkillRefs = AgentJsonSkillConfig[] | undefined;
export declare function toAgentDocument(config: StoredAgentConfig, refs: AgentSkillRefs): AgentJsonConfig;
export declare function fromAgentDocument(document: AgentJsonConfig): {
    config: StoredAgentConfig;
    skillRefs: AgentSkillRefs;
};
export declare function withoutLegacySkillRefs(config: StoredAgentConfig): StoredAgentConfig;
