import { type DataTableRowOperation } from 'n8n-workflow';
import type { SimpleWorkflow } from '../types';
export declare const DATA_TABLE_NODE_TYPE = "n8n-nodes-base.dataTable";
export declare const SET_NODE_TYPE = "n8n-nodes-base.set";
export declare const DATA_TABLE_ROW_COLUMN_MAPPING_OPERATIONS: readonly DataTableRowOperation[];
export type DataTableRowColumnOperation = (typeof DATA_TABLE_ROW_COLUMN_MAPPING_OPERATIONS)[number];
export declare function isDataTableRowColumnOperation(operation: string): operation is DataTableRowColumnOperation;
export interface ColumnDefinition {
    name: string;
    type: string;
}
export interface DataTableInfo {
    nodeName: string;
    tableName?: string;
    columns: ColumnDefinition[];
    setNodeName?: string;
    operation: DataTableRowOperation;
}
export declare function extractSetNodeFields(workflow: SimpleWorkflow, nodeName: string): ColumnDefinition[];
export declare function extractDataTableInfo(workflow: SimpleWorkflow): DataTableInfo[];
