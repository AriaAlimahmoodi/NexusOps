import { DataSource, DataSourceOptions, EntityManager } from '@n8n/typeorm';
import { DataTableColumn } from './data-table-column.entity';
export declare class DataTableDDLService {
    private dataSource;
    constructor(dataSource: DataSource);
    createTableWithColumns(dataTableId: string, columns: DataTableColumn[], trx?: EntityManager): Promise<void>;
    dropTable(dataTableId: string, trx?: EntityManager): Promise<void>;
    renameTable(oldDataTableId: string, newDataTableId: string, dbType: DataSourceOptions['type'], trx?: EntityManager): Promise<void>;
    tableExists(dataTableId: string, trx?: EntityManager): Promise<boolean>;
    addColumn(dataTableId: string, column: DataTableColumn, dbType: DataSourceOptions['type'], trx?: EntityManager): Promise<void>;
    dropColumnFromTable(dataTableId: string, columnName: string, dbType: DataSourceOptions['type'], trx?: EntityManager): Promise<void>;
    renameColumn(dataTableId: string, oldColumnName: string, newColumnName: string, dbType: DataSourceOptions['type'], trx?: EntityManager): Promise<void>;
}
