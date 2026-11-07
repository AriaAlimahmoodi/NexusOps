import type { SchemaIncompatibility, TargetColumn } from './data-table-compat';
import type { DataTableSchemaConflictPolicy } from '../../n8n-packages.types';
import type { SerializedDataTableColumn } from '../../spec/serialized/data-table.schema';
export declare function findSchemaConflict(policy: DataTableSchemaConflictPolicy, packageColumns: SerializedDataTableColumn[], targetColumns: TargetColumn[]): SchemaIncompatibility | null;
