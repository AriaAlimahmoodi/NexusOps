import { Project, WithTimestampsAndStringId } from '@n8n/db';
import { DataTableColumn } from './data-table-column.entity';
export declare class DataTable extends WithTimestampsAndStringId {
    constructor();
    name: string;
    columns: DataTableColumn[];
    project: Project;
    projectId: string;
}
