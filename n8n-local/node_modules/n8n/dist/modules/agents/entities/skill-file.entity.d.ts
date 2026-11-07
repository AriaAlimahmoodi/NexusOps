import { WithTimestamps } from '@n8n/db';
export declare class SkillFile extends WithTimestamps {
    skillVersionId: string;
    path: string;
    content: string;
}
