import type { AgentJsonConfig, AgentSkill } from '@n8n/api-types';
export declare function getAgentConfigHash(config: AgentJsonConfig): string;
export declare function getAgentConfigHash(config: null): null;
export declare function getAgentConfigHash(config: AgentJsonConfig | null): string | null;
export declare function isSameAgentConfig(a: unknown, b: unknown): boolean;
export declare function getAgentSkillHash(skill: AgentSkill): string;
