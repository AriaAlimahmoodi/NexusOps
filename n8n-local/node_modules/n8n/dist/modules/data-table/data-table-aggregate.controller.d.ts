import { ListDataTableQueryDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { DataTableAggregateService } from './data-table-aggregate.service';
import { DataTableService } from './data-table.service';
export declare class DataTableAggregateController {
    private readonly dataTableAggregateService;
    private readonly dataTableService;
    constructor(dataTableAggregateService: DataTableAggregateService, dataTableService: DataTableService);
    listDataTables(req: AuthenticatedRequest, _res: Response, payload: ListDataTableQueryDto): Promise<{
        count: number;
        data: import("./data-table.entity").DataTable[];
    }>;
    getDataTablesSize(req: AuthenticatedRequest): Promise<import("n8n-workflow").DataTablesSizeResult>;
}
