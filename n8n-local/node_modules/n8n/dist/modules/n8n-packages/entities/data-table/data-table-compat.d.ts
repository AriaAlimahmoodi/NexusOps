import type { DataTableColumnType } from 'n8n-workflow';
import type { DataTableColumnTypeMismatch, DataTableSchemaOperation } from './data-table.types';
import type { SerializedDataTable, SerializedDataTableColumn } from '../../spec/serialized/data-table.schema';
export type TargetColumn = {
    id?: string;
    name: string;
    type: DataTableColumnType;
    index: number;
};
export interface SchemaIncompatibility {
    missingColumns: string[];
    typeMismatches: DataTableColumnTypeMismatch[];
    extraColumns?: string[];
}
export declare function findSchemaIncompatibility(packageColumns: SerializedDataTableColumn[], targetColumns: Array<{
    name: string;
    type: string;
}>): SchemaIncompatibility | null;
export declare function diffDataTableSchema(packageTable: SerializedDataTable, target: {
    name: string;
    columns: TargetColumn[];
}): DataTableSchemaOperation[];
export declare function diffDataTableColumns(packageColumns: SerializedDataTableColumn[], targetColumns: TargetColumn[]): DataTableSchemaOperation[];
