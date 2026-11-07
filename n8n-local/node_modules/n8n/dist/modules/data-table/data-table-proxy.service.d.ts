import type { ListDataTableQueryDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { AddDataTableColumnOptions, CreateDataTableOptions, DataTableProxyProvider, DataTableRows, DeleteDataTableRowsOptions, IDataTableProjectAggregateService, IDataTableProjectService, DataTableInsertRowsReturnType, INode, ListDataTableRowsOptions, UpdateDataTableOptions, UpdateDataTableRowOptions, Workflow } from 'n8n-workflow';
import { InstanceWriteAccessService } from '@n8n/backend-services';
import { OwnershipService } from '../../services/ownership.service';
import { DataTableAggregateService } from './data-table-aggregate.service';
import { DataTableService } from './data-table.service';
declare const ALLOWED_NODES: readonly ['n8n-nodes-base.dataTable', 'n8n-nodes-base.dataTableTool', 'n8n-nodes-base.evaluationTrigger', 'n8n-nodes-base.evaluation'];
type AllowedNode = (typeof ALLOWED_NODES)[number];
export declare function isAllowedNode(s: string): s is AllowedNode;
export declare class DataTableProxyService implements DataTableProxyProvider {
    private readonly dataTableService;
    private readonly dataTableAggregateService;
    private readonly ownershipService;
    private readonly logger;
    private readonly instanceWriteAccess;
    constructor(dataTableService: DataTableService, dataTableAggregateService: DataTableAggregateService, ownershipService: OwnershipService, logger: Logger, instanceWriteAccess: InstanceWriteAccessService);
    private validateRequest;
    private getProjectId;
    getDataTableAggregateProxy(workflow: Workflow, node: INode, projectId?: string): Promise<IDataTableProjectAggregateService>;
    getDataTableProxy(workflow: Workflow, node: INode, dataTableId: string, projectId?: string): Promise<IDataTableProjectService>;
    private requireScope;
    makeDataTableOperationsForUser(user: User): {
        getManyAndCount(options: ListDataTableQueryDto): Promise<{
            count: number;
            data: import("./data-table.entity").DataTable[];
        }>;
        createDataTable(projectId: string, options: CreateDataTableOptions): Promise<import("./data-table.entity").DataTable>;
        getColumns(dataTableId: string, projectId: string): Promise<import("./data-table-column.entity").DataTableColumn[]>;
        updateDataTable(dataTableId: string, projectId: string, options: UpdateDataTableOptions): Promise<boolean>;
        addColumn(dataTableId: string, projectId: string, options: AddDataTableColumnOptions): Promise<import("./data-table-column.entity").DataTableColumn>;
        deleteColumn(dataTableId: string, projectId: string, columnId: string): Promise<boolean>;
        renameColumn(dataTableId: string, projectId: string, columnId: string, options: {
            name: string;
        }): Promise<{
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
        deleteDataTable(dataTableId: string, projectId: string): Promise<boolean>;
        getManyRowsAndCount(dataTableId: string, projectId: string, options: Partial<ListDataTableRowsOptions>): Promise<{
            count: number;
            data: import("n8n-workflow").DataTableRowsReturn;
        }>;
        insertRows<T extends DataTableInsertRowsReturnType>(dataTableId: string, projectId: string, rows: DataTableRows, returnType: T): Promise<import("n8n-workflow").DataTableInsertRowsResult<T>>;
        updateRows(dataTableId: string, projectId: string, options: UpdateDataTableRowOptions): Promise<import("n8n-workflow").DataTableRowReturn[] | import("n8n-workflow").DataTableRowReturnWithState[]>;
        deleteRows(dataTableId: string, projectId: string, options: DeleteDataTableRowsOptions): Promise<import("n8n-workflow").DataTableRowReturn[]>;
        clearRows(dataTableId: string, projectId: string): Promise<{
            deletedCount: number;
        }>;
    };
    private makeAggregateOperations;
    private makeDataTableOperations;
}
export type DataTableUserOperations = ReturnType<DataTableProxyService['makeDataTableOperationsForUser']>;
export {};
