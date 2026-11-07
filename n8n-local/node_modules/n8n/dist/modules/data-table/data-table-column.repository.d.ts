import { DataTableCreateColumnSchema } from '@n8n/api-types';
import { BaseRepository, type OperationContext, TransactionRunner } from '@n8n/db';
import { DataSource, EntityManager } from '@n8n/typeorm';
import { DataTableColumn } from './data-table-column.entity';
import { DataTableDDLService } from './data-table-ddl.service';
import { DataTable } from './data-table.entity';
export declare class DataTableColumnRepository extends BaseRepository<DataTableColumn> {
    private ddlService;
    constructor(dataSource: DataSource, ddlService: DataTableDDLService, transactionRunner: TransactionRunner);
    private validateNotSystemColumn;
    private validateUniqueColumnName;
    getColumns(dataTableId: string, trx?: EntityManager): Promise<DataTableColumn[]>;
    findTableIdsByColumnIds(columnIds: string[]): Promise<Array<Pick<DataTableColumn, 'id' | 'dataTableId'>>>;
    getColumnByIdOrFail(dataTableId: string, columnId: string): Promise<DataTableColumn>;
    private normalizeAddColumnIndex;
    addColumn(dataTableId: string, schema: DataTableCreateColumnSchema, trx?: EntityManager, explicitId?: string): Promise<DataTableColumn>;
    deleteColumn(dataTableId: string, column: DataTableColumn, trx?: EntityManager): Promise<void>;
    replaceSchema(dataTableId: string, projectId: string, schema: {
        name: string;
        columns: Array<Pick<DataTableColumn, 'name' | 'type'> & {
            id?: string;
        }>;
    }, ctx?: OperationContext): Promise<void>;
    moveColumn(dataTableId: string, column: DataTableColumn, targetIndex: number, trx?: EntityManager): Promise<void>;
    renameColumn(dataTableId: string, column: DataTableColumn, newName: string, trx?: EntityManager): Promise<{
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
    shiftColumns(dataTableId: string, lowestIndex: number, delta: -1 | 1, trx?: EntityManager): Promise<void>;
}
