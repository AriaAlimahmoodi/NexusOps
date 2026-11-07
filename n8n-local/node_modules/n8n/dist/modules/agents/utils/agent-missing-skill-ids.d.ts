import { type AgentSkill } from '@n8n/api-types';
import type { AgentSkillRefs } from '../json-config/agent-document';
export declare function getMissingSkillIds(skillRefs: AgentSkillRefs, skills: Record<string, AgentSkill>): string[];
