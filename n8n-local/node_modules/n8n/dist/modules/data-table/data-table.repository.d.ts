import { type DataTableCreateColumnSchema, type ListDataTableQueryDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { DataSource, EntityManager, Repository } from '@n8n/typeorm';
import type { DataTablesSizeData } from 'n8n-workflow';
import { DataTableDDLService } from './data-table-ddl.service';
import { DataTable } from './data-table.entity';
export declare class DataTableRepository extends Repository<DataTable> {
    private ddlService;
    private readonly globalConfig;
    private readonly logger;
    constructor(dataSource: DataSource, ddlService: DataTableDDLService, globalConfig: GlobalConfig, logger: Logger);
    touchUpdatedAt(dataTableId: string, trx?: EntityManager): Promise<void>;
    createDataTable(projectId: string, name: string, columns: DataTableCreateColumnSchema[], trx?: EntityManager, explicitId?: string, explicitColumnIds?: Array<string | undefined>): Promise<DataTable>;
    deleteDataTable(dataTableId: string, trx?: EntityManager): Promise<boolean>;
    transferDataTableByProjectId(fromProjectId: string, toProjectId: string, trx?: EntityManager): Promise<boolean>;
    deleteDataTableByProjectId(projectId: string, trx?: EntityManager): Promise<boolean>;
    deleteDataTableAll(trx?: EntityManager): Promise<boolean>;
    findSummariesByIds(ids: string[]): Promise<Array<Pick<DataTable, 'id' | 'name' | 'projectId'>>>;
    getManyAndCount(options: Partial<ListDataTableQueryDto>): Promise<{
        count: number;
        data: DataTable[];
    }>;
    getMany(options: Partial<ListDataTableQueryDto>): Promise<DataTable[]>;
    private getManyQuery;
    private applySelections;
    private applyFilters;
    private applySorting;
    private applySortingByField;
    private applyPagination;
    private applyDefaultSelect;
    private getDataTableColumnFields;
    private getProjectFields;
    private parseSize;
    findDataTablesSize(): Promise<DataTablesSizeData>;
    private getDataTableSizeQuery;
    private getAllDataTablesSizeMap;
}
