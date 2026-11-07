import type { ModuleInterface, SystemTaskClass } from '@n8n/decorators';
export declare class DataTableModule implements ModuleInterface {
    init(): Promise<void>;
    systemTasks(): Promise<SystemTaskClass[]>;
    shutdown(): Promise<void>;
    entities(): Promise<(typeof import("./data-table.entity.js").DataTable | typeof import("./data-table-column.entity.js").DataTableColumn)[]>;
    context(): Promise<{
        dataTableProxyProvider: import("./data-table-proxy.service.js").DataTableProxyService;
    }>;
}
