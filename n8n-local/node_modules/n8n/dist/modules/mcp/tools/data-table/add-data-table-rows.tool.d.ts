import type { User } from '@n8n/db';
import z from 'zod';
import type { DataTableUserOperations } from '../../../../modules/data-table/data-table-proxy.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const addRowsInputSchema: {
    dataTableId: z.ZodString;
    projectId: z.ZodString;
    rows: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>, "many">;
};
export declare const createAddDataTableRowsTool: (user: User, dataTableOps: DataTableUserOperations, telemetry: Telemetry) => ToolDefinition<typeof addRowsInputSchema>;
export {};
