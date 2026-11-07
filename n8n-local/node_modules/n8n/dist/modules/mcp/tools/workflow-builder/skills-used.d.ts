export declare const SKILLS_USED_PARAM_DESCRIPTION = "IDs of n8n skills used to prepare this call, e.g. \"workflow-builder\". An optional plugin prefix is allowed, e.g. \"n8n-skills:workflow-builder\". Entries are normalized server-side (trimmed, lowercased, deduped); invalid identifiers are dropped.";
export declare function sanitizeSkillsUsed(input: unknown): string[] | undefined;
