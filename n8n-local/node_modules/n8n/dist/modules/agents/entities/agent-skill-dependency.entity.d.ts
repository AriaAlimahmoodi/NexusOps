import { WithCreatedAt } from '@n8n/db';
export declare class AgentSkillDependency extends WithCreatedAt {
    agentId: string;
    skillId: string;
    skillVersionId: string | null;
}
