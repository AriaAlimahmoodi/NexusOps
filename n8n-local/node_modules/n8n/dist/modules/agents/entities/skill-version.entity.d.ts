import { WithTimestamps } from '@n8n/db';
export type SkillFrontmatter = Record<string, unknown>;
export declare class SkillVersion extends WithTimestamps {
    id: string;
    skillId: string;
    version: number;
    name: string;
    description: string;
    instructions: string;
    frontmatter: SkillFrontmatter | null;
    contentHash: string;
    createdById: string | null;
}
