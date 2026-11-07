import type { DataTable } from '../../../../modules/data-table/data-table.entity';
import { type SerializedDataTable } from '../../spec/serialized/data-table.schema';
export declare class DataTableSerializer {
    serialize(dataTable: DataTable): SerializedDataTable;
}
