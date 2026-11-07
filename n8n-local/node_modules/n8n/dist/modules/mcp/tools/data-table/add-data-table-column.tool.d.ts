import type { User } from '@n8n/db';
import z from 'zod';
import type { DataTableUserOperations } from '../../../../modules/data-table/data-table-proxy.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    dataTableId: z.ZodString;
    projectId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["string", "number", "boolean", "date"]>;
};
export declare const createAddDataTableColumnTool: (user: User, dataTableOps: DataTableUserOperations, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
