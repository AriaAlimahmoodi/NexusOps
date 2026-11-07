import type { AddDataTableColumnDto, CreateDataTableDto, DeleteDataTableRowsDto, ListDataTableContentQueryDto, MoveDataTableColumnDto, RenameDataTableColumnDto, DataTableListOptions, UpsertDataTableRowDto, UpdateDataTableDto, UpdateDataTableRowDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService, RoleService } from '@n8n/backend-services';
import { ProjectRelationRepository, ProjectRepository, type User } from '@n8n/db';
import { type Scope } from '@n8n/permissions';
import { type EntityManager } from '@n8n/typeorm';
import type { DataTableFilter, DataTableRow, DataTableRowReturn, DataTableRows, DataTableInsertRowsReturnType, DataTableInsertRowsResult, DataTablesSizeResult, DataTableRowReturnWithState } from 'n8n-workflow';
import { DataTableColumn } from './data-table-column.entity';
import { DataTableColumnRepository } from './data-table-column.repository';
import { DataTableCsvImportService } from './data-table-csv-import.service';
import { DataTableRowsRepository } from './data-table-rows.repository';
import { DataTableSizeValidator } from './data-table-size-validator.service';
import type { DataTable } from './data-table.entity';
import { DataTableRepository } from './data-table.repository';
import { ProjectService } from '../../services/project.service.ee';
export declare class DataTableService {
    private readonly dataTableRepository;
    private readonly dataTableColumnRepository;
    private readonly dataTableRowsRepository;
    private readonly logger;
    private readonly dataTableSizeValidator;
    private readonly projectRelationRepository;
    private readonly roleService;
    private readonly csvImportService;
    private readonly eventService;
    private readonly projectRepository;
    private readonly projectService;
    constructor(dataTableRepository: DataTableRepository, dataTableColumnRepository: DataTableColumnRepository, dataTableRowsRepository: DataTableRowsRepository, logger: Logger, dataTableSizeValidator: DataTableSizeValidator, projectRelationRepository: ProjectRelationRepository, roleService: RoleService, csvImportService: DataTableCsvImportService, eventService: EventService, projectRepository: ProjectRepository, projectService: ProjectService);
    start(): Promise<void>;
    shutdown(): Promise<void>;
    getProjectIdForDataTable(dataTableId: string): Promise<string>;
    getOne(dataTableId: string, projectId: string): Promise<DataTable>;
    resolveOwningProjectId(user: User, projectId?: string): Promise<string>;
    createDataTable(projectId: string, dto: CreateDataTableDto, id?: string, columnIds?: Array<string | undefined>): Promise<DataTable>;
    findDataTablesByIds(dataTableIds: string[]): Promise<DataTable[]>;
    findTableIdsByColumnIds(columnIds: string[]): Promise<Array<Pick<DataTableColumn, 'id' | 'dataTableId'>>>;
    findDataTablesByNamesInProject(projectId: string, names: string[]): Promise<Array<Pick<DataTable, 'id' | 'name'>>>;
    importCsvToExistingTable(dataTableId: string, projectId: string, fileId: string): Promise<{
        importedRowCount: number;
        systemColumnsIgnored: string[];
    }>;
    updateDataTable(dataTableId: string, projectId: string, dto: UpdateDataTableDto): Promise<boolean>;
    transferDataTablesByProjectId(fromProjectId: string, toProjectId: string, trx?: EntityManager): Promise<boolean>;
    deleteDataTableByProjectId(projectId: string): Promise<boolean>;
    deleteDataTableAll(): Promise<boolean>;
    deleteDataTable(dataTableId: string, projectId: string): Promise<boolean>;
    addColumn(dataTableId: string, projectId: string, dto: AddDataTableColumnDto): Promise<DataTableColumn>;
    replaceSchema(dataTableId: string, projectId: string, schema: {
        name: string;
        columns: Array<Pick<DataTableColumn, 'name' | 'type'> & {
            id?: string;
        }>;
    }): Promise<void>;
    moveColumn(dataTableId: string, projectId: string, columnId: string, dto: MoveDataTableColumnDto): Promise<boolean>;
    deleteColumn(dataTableId: string, projectId: string, columnId: string): Promise<boolean>;
    renameColumn(dataTableId: string, projectId: string, columnId: string, dto: RenameDataTableColumnDto): Promise<{
        id: string;
        generateId(): void;
        createdAt: Date;
        updatedAt: Date;
        setUpdateDate(): void;
        dataTableId: string;
        type: 'string' | 'number' | 'boolean' | 'date';
        index: number;
        dataTable: DataTable;
        name: string;
    }>;
    getManyAndCount(options: DataTableListOptions): Promise<{
        count: number;
        data: DataTable[];
    }>;
    getManyRowsAndCount(dataTableId: string, projectId: string, dto: ListDataTableContentQueryDto): Promise<{
        count: number;
        data: import("n8n-workflow").DataTableRowsReturn;
    }>;
    getColumns(dataTableId: string, projectId: string): Promise<DataTableColumn[]>;
    getColumnById({ projectId, dataTableId, columnId, }: {
        projectId: string;
        dataTableId: string;
        columnId: string;
    }): Promise<DataTableColumn>;
    insertRows<T extends DataTableInsertRowsReturnType = 'count'>(dataTableId: string, projectId: string, rows: DataTableRows, returnType?: T): Promise<DataTableInsertRowsResult<T>>;
    upsertRow(dataTableId: string, projectId: string, dto: Omit<UpsertDataTableRowDto, 'returnData' | 'dryRun'>, returnData: true, dryRun?: boolean): Promise<DataTableRowReturn[] | DataTableRowReturnWithState[]>;
    upsertRow(dataTableId: string, projectId: string, dto: Omit<UpsertDataTableRowDto, 'returnData' | 'dryRun'>, returnData?: boolean, dryRun?: true): Promise<DataTableRowReturnWithState[]>;
    upsertRow(dataTableId: string, projectId: string, dto: Omit<UpsertDataTableRowDto, 'returnData' | 'dryRun'>, returnData?: false, dryRun?: false): Promise<true>;
    upsertRow(dataTableId: string, projectId: string, dto: Omit<UpsertDataTableRowDto, 'returnData' | 'dryRun'>, returnData: boolean, dryRun: boolean): Promise<DataTableRowReturn[] | DataTableRowReturnWithState[] | true>;
    validateAndTransformUpdateParams({ filter, data }: Pick<UpdateDataTableRowDto, 'filter' | 'data'>, columns: DataTableColumn[]): {
        data: DataTableRow;
        filter: DataTableFilter;
    };
    updateRows(dataTableId: string, projectId: string, dto: Omit<UpdateDataTableRowDto, 'returnData' | 'dryRun'>, returnData: true, dryRun?: boolean): Promise<DataTableRowReturn[] | DataTableRowReturnWithState[]>;
    updateRows(dataTableId: string, projectId: string, dto: Omit<UpdateDataTableRowDto, 'returnData' | 'dryRun'>, returnData?: boolean, dryRun?: true): Promise<DataTableRowReturnWithState[]>;
    updateRows(dataTableId: string, projectId: string, dto: Omit<UpdateDataTableRowDto, 'returnData' | 'dryRun'>, returnData?: false, dryRun?: false): Promise<true>;
    updateRows(dataTableId: string, projectId: string, dto: Omit<UpdateDataTableRowDto, 'returnData' | 'dryRun'>, returnData: boolean, dryRun: boolean): Promise<DataTableRowReturn[] | DataTableRowReturnWithState[] | true>;
    deleteRows(dataTableId: string, projectId: string, dto: Omit<DeleteDataTableRowsDto, 'returnData' | 'dryRun'>, returnData: true, dryRun?: boolean): Promise<DataTableRowReturn[]>;
    deleteRows(dataTableId: string, projectId: string, dto: Omit<DeleteDataTableRowsDto, 'returnData' | 'dryRun'>, returnData?: boolean, dryRun?: true): Promise<DataTableRowReturn[]>;
    deleteRows(dataTableId: string, projectId: string, dto: Omit<DeleteDataTableRowsDto, 'returnData' | 'dryRun'>, returnData?: false, dryRun?: false): Promise<true>;
    deleteRows(dataTableId: string, projectId: string, dto: Omit<DeleteDataTableRowsDto, 'returnData' | 'dryRun'>, returnData: boolean, dryRun: boolean): Promise<DataTableRowReturn[] | true>;
    clearRows(dataTableId: string, projectId: string): Promise<{
        deletedCount: number;
    }>;
    private validateAndTransformRows;
    private validateAndTransformCell;
    validateDataTableExists(dataTableId: string, projectId: string): Promise<DataTable>;
    private validateColumnExists;
    private validateUniqueName;
    private validateAndTransformFilters;
    private validateDataTableSize;
    getDataTablesSize(user: User): Promise<DataTablesSizeResult>;
    getCachedSizeBytesByIds(dataTableIds: string[]): Promise<Map<string, number>>;
    findDataTablesByIdsForUser(dataTableIds: string[], user: User, scopes: Scope[]): Promise<DataTable[]>;
    generateDataTableCsv(dataTableId: string, projectId: string, includeSystemColumns?: boolean): Promise<{
        csvContent: string;
        dataTableName: string;
    }>;
    private buildCsvContent;
    private formatValueForCsv;
    private formatDateForCsv;
    private escapeCsvValue;
}
