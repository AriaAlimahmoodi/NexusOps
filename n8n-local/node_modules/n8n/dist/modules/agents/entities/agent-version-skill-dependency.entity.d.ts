import { WithCreatedAt } from '@n8n/db';
export declare class AgentVersionSkillDependency extends WithCreatedAt {
    agentVersionId: string;
    skillId: string;
    skillVersionId: string;
}
