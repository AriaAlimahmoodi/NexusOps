import { WithTimestamps } from '@n8n/db';
export type SkillSource = 'ui' | 'agent';
export declare class Skill extends WithTimestamps {
    id: string;
    projectId: string | null;
    agentId: string | null;
    source: SkillSource;
    createdById: string | null;
}
