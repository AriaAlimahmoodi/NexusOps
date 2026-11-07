import type { SkillFrontmatter } from '../entities/skill-version.entity';
export type SkillContent = {
    name: string;
    description: string;
    instructions: string;
    frontmatter: SkillFrontmatter | null;
    files: Array<{
        path: string;
        content: string;
    }>;
};
export declare function compareSkillFilePaths(left: string, right: string): number;
export declare function skillContentHash(content: SkillContent): string;
