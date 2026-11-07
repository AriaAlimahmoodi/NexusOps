import type { BreakingChangeVersion } from '@n8n/api-types';
import type { MigrationFinding, MigrationFindingId } from '../database/entities/migration-finding.entity';
import type { NewMigrationFinding } from '../database/repositories/migration-finding.repository';
export interface MigrationFindingHit {
    ruleId: string;
    workflowId: string;
}
export interface MigrationFindingDiffInput {
    targetVersion: BreakingChangeVersion;
    workflowIds: string[];
    hits: MigrationFindingHit[];
    existing: MigrationFinding[];
    unknown?: MigrationFindingHit[];
}
export interface MigrationFindingDiff {
    toInsert: NewMigrationFinding[];
    toMarkFixed: MigrationFindingId[];
    toReopen: MigrationFindingId[];
}
export declare function diffMigrationFindings(input: MigrationFindingDiffInput): MigrationFindingDiff;
