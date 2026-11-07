import type { Role } from '@n8n/db';
export declare function assertRoleCompatibleWithMappingType(role: Role, type: 'instance' | 'project'): void;
export declare function assertAndNormalizeProjectIdsForRuleType(type: 'instance' | 'project', explicitProjectIds: string[] | undefined, fallbackWhenOmitted: string[]): string[];
