import type { DataTable } from '../../../../modules/data-table/data-table.entity';
import type { DataTableMatchingMode } from '../../n8n-packages.types';
import type { PackageDataTableRequirement } from '../../spec/requirements.schema';
export interface MatchCandidates {
    projectId: string;
    targetsById: ReadonlyMap<string, DataTable>;
}
export declare function matchTargetTable(mode: DataTableMatchingMode, requirement: Pick<PackageDataTableRequirement, 'id'>, candidates: MatchCandidates): DataTable | undefined;
