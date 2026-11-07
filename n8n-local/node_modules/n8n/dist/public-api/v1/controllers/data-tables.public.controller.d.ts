import { ClearDataTableRowsResponsePublicDto, CreateDataTableColumnPublicDto, CreateDataTablePublicDto, CreateDataTableRowsPublicDto, DataTableColumnListPublicDto, DataTableColumnPublicDto, DataTableListPublicDto, DataTablePublicDto, DataTableRowListPublicDto, DeleteDataTableRowsPublicQueryDto, PublicApiListDataTableQueryDto, PublicApiListDataTableRowsQueryDto, UpdateDataTableColumnPublicDto, UpdateDataTablePublicDto, UpdateDataTableRowPublicDto, UpsertDataTableRowPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import type { DataTableRowReturn } from 'n8n-workflow';
import { DataTableAggregateService } from '../../../modules/data-table/data-table-aggregate.service';
import { DataTableService } from '../../../modules/data-table/data-table.service';
export declare class DataTablesPublicController {
    private readonly dataTableService;
    private readonly dataTableAggregateService;
    constructor(dataTableService: DataTableService, dataTableAggregateService: DataTableAggregateService);
    listDataTables(req: AuthenticatedRequest, _res: Response, query: PublicApiListDataTableQueryDto): Promise<DataTableListPublicDto>;
    createDataTable(req: AuthenticatedRequest, _res: Response, body: CreateDataTablePublicDto): Promise<DataTablePublicDto>;
    getDataTable(_req: AuthenticatedRequest, _res: Response, dataTableId: string): Promise<DataTablePublicDto>;
    updateDataTable(_req: AuthenticatedRequest, _res: Response, dataTableId: string, body: UpdateDataTablePublicDto): Promise<DataTablePublicDto>;
    deleteDataTable(_req: AuthenticatedRequest, _res: Response, dataTableId: string): Promise<void>;
    listDataTableColumns(_req: AuthenticatedRequest, _res: Response, dataTableId: string): Promise<DataTableColumnListPublicDto>;
    createDataTableColumn(_req: AuthenticatedRequest, _res: Response, dataTableId: string, body: CreateDataTableColumnPublicDto): Promise<DataTableColumnPublicDto>;
    updateDataTableColumn(_req: AuthenticatedRequest, _res: Response, dataTableId: string, columnId: string, body: UpdateDataTableColumnPublicDto): Promise<DataTableColumnPublicDto>;
    deleteDataTableColumn(_req: AuthenticatedRequest, _res: Response, dataTableId: string, columnId: string): Promise<void>;
    listDataTableRows(_req: AuthenticatedRequest, _res: Response, dataTableId: string, query: PublicApiListDataTableRowsQueryDto): Promise<DataTableRowListPublicDto>;
    createDataTableRows(_req: AuthenticatedRequest, _res: Response, dataTableId: string, body: CreateDataTableRowsPublicDto): Promise<Pick<DataTableRowReturn, "id">[] | import("n8n-workflow").DataTableInsertRowsBulkResult>;
    upsertDataTableRow(req: AuthenticatedRequest, _res: Response, dataTableId: string, body: UpsertDataTableRowPublicDto): Promise<boolean | ({
        id: number;
        createdAt: string;
        updatedAt: string;
    } | {
        id: number | null;
        createdAt: string | null;
        updatedAt: string | null;
        dryRunState: "after" | "before";
    })[]>;
    updateDataTableRows(req: AuthenticatedRequest, _res: Response, dataTableId: string, body: UpdateDataTableRowPublicDto): Promise<boolean | ({
        id: number;
        createdAt: string;
        updatedAt: string;
    } | {
        id: number | null;
        createdAt: string | null;
        updatedAt: string | null;
        dryRunState: "after" | "before";
    })[]>;
    clearDataTableRows(_req: AuthenticatedRequest, _res: Response, dataTableId: string): Promise<ClearDataTableRowsResponsePublicDto>;
    deleteDataTableRows(req: AuthenticatedRequest, _res: Response, dataTableId: string, query: DeleteDataTableRowsPublicQueryDto): Promise<boolean | ({
        id: number;
        createdAt: string;
        updatedAt: string;
    } | {
        id: number | null;
        createdAt: string | null;
        updatedAt: string | null;
        dryRunState: "after" | "before";
    })[]>;
    private withSize;
}
