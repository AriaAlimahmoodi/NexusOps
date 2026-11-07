import { ModuleRegistry } from '@n8n/backend-common';
import { DataTableService } from '../../../../modules/data-table/data-table.service';
import type { DataTableImportPlan, DataTableImportRequest, DataTableUpdate } from './data-table.types';
import type { ImportContext } from '../../n8n-packages.types';
import type { SerializedDataTable } from '../../spec/serialized/data-table.schema';
export declare class DataTableImporter {
    private readonly dataTableService;
    private readonly moduleRegistry;
    constructor(dataTableService: DataTableService, moduleRegistry: ModuleRegistry);
    plan(context: ImportContext, request: DataTableImportRequest): Promise<DataTableImportPlan>;
    findDestructiveChanges<T extends {
        id: string;
        projectId: string;
    }>(references: T[], packageDataTables: SerializedDataTable[]): Promise<Array<DataTableUpdate & {
        reference: T;
    }>>;
    apply(context: ImportContext, plan: DataTableImportPlan): Promise<void>;
    private assertColumnIdsAvailable;
    private writeFailures;
}
