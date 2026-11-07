import type { DataTableResolutionFailure } from './data-table.types';
import type { DataTableMissingMode } from '../../n8n-packages.types';
import type { PackageDataTableRequirement } from '../../spec/requirements.schema';
export type TableEffect = {
    action: 'create';
} | {
    action: 'skip';
} | {
    action: 'fail';
    failure: DataTableResolutionFailure;
};
export declare function decideAbsentTable(mode: DataTableMissingMode, requirement: PackageDataTableRequirement): TableEffect;
