import type { BreakingChangeVersion } from '@n8n/api-types';
import { BaseEntity } from '@n8n/typeorm';
export declare class MigrationFindingSync extends BaseEntity {
    targetVersion: BreakingChangeVersion;
    syncedAt: Date;
    ruleSetFingerprint: string;
}
