import type { User } from '@n8n/db';
import z from 'zod';
import type { DataTableUserOperations } from '../../../../modules/data-table/data-table-proxy.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    dataTableId: z.ZodString;
    projectId: z.ZodString;
    columnId: z.ZodString;
    name: z.ZodString;
};
export declare const createRenameDataTableColumnTool: (user: User, dataTableOps: DataTableUserOperations, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
