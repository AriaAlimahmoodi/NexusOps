import type { User } from '@n8n/db';
import z from 'zod';
import type { DataTableUserOperations } from '../../../../modules/data-table/data-table-proxy.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const createInputSchema: {
    projectId: z.ZodString;
    name: z.ZodString;
    columns: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["string", "number", "boolean", "date"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: "boolean" | "date" | "number" | "string";
    }, {
        name: string;
        type: "boolean" | "date" | "number" | "string";
    }>, "many">;
};
export declare const createCreateDataTableTool: (user: User, dataTableOps: DataTableUserOperations, telemetry: Telemetry) => ToolDefinition<typeof createInputSchema>;
export {};
