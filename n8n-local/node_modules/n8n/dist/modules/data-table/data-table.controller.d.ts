import { AddDataTableRowsDto, AddDataTableColumnDto, CreateDataTableDto, DeleteDataTableRowsDto, DownloadDataTableCsvQueryDto, ImportCsvToDataTableDto, ListDataTableContentQueryDto, ListDataTableQueryDto, MoveDataTableColumnDto, RenameDataTableColumnDto, UpdateDataTableDto, UpdateDataTableRowDto, UpsertDataTableRowDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { NextFunction, Response } from 'express';
import { DataTableRowReturn } from 'n8n-workflow';
import { InstanceWriteAccessService } from '@n8n/backend-services';
import { ProjectService } from '../../services/project.service.ee';
import { DataTableService } from './data-table.service';
export declare class DataTableController {
    private readonly dataTableService;
    private readonly projectService;
    private readonly instanceWriteAccess;
    constructor(dataTableService: DataTableService, projectService: ProjectService, instanceWriteAccess: InstanceWriteAccessService);
    private handleDataTableColumnOperationError;
    validateProjectExists(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: Response, next: NextFunction): Promise<void>;
    createDataTable(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dto: CreateDataTableDto): Promise<import("./data-table.entity").DataTable>;
    listProjectDataTables(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, payload: ListDataTableQueryDto): Promise<{
        count: number;
        data: import("./data-table.entity").DataTable[];
    }>;
    updateDataTable(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: UpdateDataTableDto): Promise<boolean>;
    deleteDataTable(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string): Promise<boolean>;
    getColumns(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string): Promise<import("./data-table-column.entity").DataTableColumn[]>;
    addColumn(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: AddDataTableColumnDto): Promise<import("./data-table-column.entity").DataTableColumn>;
    deleteColumn(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, columnId: string): Promise<boolean>;
    moveColumn(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, columnId: string, dto: MoveDataTableColumnDto): Promise<boolean>;
    renameColumn(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, columnId: string, dto: RenameDataTableColumnDto): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        dataTableId: string;
        type: 'string' | 'number' | 'boolean' | 'date';
        index: number;
        dataTable: import("./data-table.entity").DataTable;
        name: string;
    }>;
    getDataTableRows(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: ListDataTableContentQueryDto): Promise<{
        count: number;
        data: import("n8n-workflow").DataTableRowsReturn;
    }>;
    downloadDataTableCsv(req: AuthenticatedRequest<{
        projectId: string;
        dataTableId: string;
    }>, _res: Response, query: DownloadDataTableCsvQueryDto): Promise<{
        csvContent: string;
        dataTableName: string;
    }>;
    appendDataTableRows<T extends DataTableRowReturn | undefined>(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: AddDataTableRowsDto & {
        returnType?: T;
    }): Promise<Array<T extends true ? DataTableRowReturn : Pick<DataTableRowReturn, 'id'>>>;
    importCsvToDataTable(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: ImportCsvToDataTableDto): Promise<{
        importedRowCount: number;
        systemColumnsIgnored: string[];
    }>;
    upsertDataTableRow(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: UpsertDataTableRowDto): Promise<true | DataTableRowReturn[] | import("n8n-workflow").DataTableRowReturnWithState[]>;
    updateDataTableRows(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: UpdateDataTableRowDto): Promise<true | DataTableRowReturn[] | import("n8n-workflow").DataTableRowReturnWithState[]>;
    deleteDataTableRows(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dataTableId: string, dto: DeleteDataTableRowsDto): Promise<true | DataTableRowReturn[]>;
}
