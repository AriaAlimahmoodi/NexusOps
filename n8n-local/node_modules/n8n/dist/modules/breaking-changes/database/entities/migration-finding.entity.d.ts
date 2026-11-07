import type { BreakingChangeVersion, MigrationFindingStatus } from '@n8n/api-types';
import { WithTimestamps } from '@n8n/db';
import type { WorkflowEntity } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
export declare class MigrationFinding extends WithTimestamps {
    id: number;
    targetVersion: BreakingChangeVersion;
    ruleId: string;
    workflowId: string;
    workflow: Relation<WorkflowEntity>;
    status: MigrationFindingStatus;
    note: string | null;
    notifiedAt: Date | null;
    statusChangedAt: Date;
}
export type MigrationFindingId = MigrationFinding['id'];
