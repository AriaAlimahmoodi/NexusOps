import { ModuleRegistry } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { DataTableService } from '../../../../modules/data-table/data-table.service';
import { DataTableSerializer } from './data-table.serializer';
import type { DataTableRequirement } from './data-table.types';
import type { PackageWriter } from '../../io/package-writer';
import type { ManifestEntry } from '../../spec/manifest.schema';
import type { PackageDataTableRequirement } from '../../spec/requirements.schema';
export interface DataTableExportRequest {
    user: User;
    requirements: DataTableRequirement[];
    writer: PackageWriter;
    projectTargetsById?: Map<string, string>;
}
export interface DataTableExportResult {
    entries: ManifestEntry[];
    requirements: PackageDataTableRequirement[];
}
export declare class DataTableExporter {
    private readonly dataTableService;
    private readonly dataTableSerializer;
    private readonly moduleRegistry;
    constructor(dataTableService: DataTableService, dataTableSerializer: DataTableSerializer, moduleRegistry: ModuleRegistry);
    export(request: DataTableExportRequest): Promise<DataTableExportResult>;
    private assertAllRequestedDataTablesFound;
}
