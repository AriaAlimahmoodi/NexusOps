import { DataTableFilter, ListDataTableContentQueryDto } from '@n8n/api-types';
import { DataSource, EntityManager } from '@n8n/typeorm';
import { DataTableColumnJsType, DataTableRows, DataTableRowReturn, DataTableRowsReturn, DataTableInsertRowsReturnType, DataTableInsertRowsResult, DataTableRowReturnWithState } from 'n8n-workflow';
import { DataTableColumn } from './data-table-column.entity';
import { DataTableUserTableName } from './data-table.types';
export declare class DataTableRowsRepository {
    private dataSource;
    constructor(dataSource: DataSource);
    insertRowsBulk(table: DataTableUserTableName, rows: DataTableRows, columns: DataTableColumn[], trx?: EntityManager): Promise<{
        readonly success: true;
        readonly insertedRows: number;
    }>;
    insertRows<T extends DataTableInsertRowsReturnType>(dataTableId: string, rows: DataTableRows, columns: DataTableColumn[], returnType: T, trx?: EntityManager): Promise<DataTableInsertRowsResult<T>>;
    updateRows<T extends boolean | undefined>(dataTableId: string, data: Record<string, DataTableColumnJsType | null>, filter: DataTableFilter, columns: DataTableColumn[], returnData?: T, trx?: EntityManager): Promise<T extends true ? DataTableRowReturn[] : true>;
    dryRunUpdateRows(dataTableId: string, data: Record<string, DataTableColumnJsType | null>, filter: DataTableFilter, columns: DataTableColumn[], trx?: EntityManager): Promise<DataTableRowReturnWithState[]>;
    dryRunUpsertRow(dataTableId: string, data: Record<string, DataTableColumnJsType | null>, filter: DataTableFilter, columns: DataTableColumn[], trx?: EntityManager): Promise<DataTableRowReturnWithState[]>;
    deleteRows(dataTableId: string, columns: DataTableColumn[], filter: DataTableFilter | undefined, returnData?: boolean, dryRun?: boolean, trx?: EntityManager): Promise<true | DataTableRowReturn[] | DataTableRowReturnWithState[]>;
    clearRows(dataTableId: string, trx?: EntityManager): Promise<{
        deletedCount: number;
    }>;
    private getAffectedRowsForUpdate;
    private prepareUpdateData;
    private toDryRunRows;
    getManyAndCount(dataTableId: string, dto: ListDataTableContentQueryDto, columns: DataTableColumn[], trx?: EntityManager): Promise<{
        count: number;
        data: DataTableRowsReturn;
    }>;
    getManyByIds(dataTableId: string, ids: number[], columns: DataTableColumn[], trx?: EntityManager): Promise<DataTableRowsReturn>;
    private getManyQuery;
    private applySearch;
    private applyFilters;
    private applySorting;
    private applySortingByField;
    private applyPagination;
}
