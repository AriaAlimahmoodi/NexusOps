import { WithTimestampsAndStringId } from '@n8n/db';
import { type DataTable } from './data-table.entity';
export declare class DataTableColumn extends WithTimestampsAndStringId {
    dataTableId: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    index: number;
    dataTable: DataTable;
}
