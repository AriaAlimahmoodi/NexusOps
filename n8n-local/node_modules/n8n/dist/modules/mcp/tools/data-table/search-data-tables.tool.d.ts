import type { User } from '@n8n/db';
import z from 'zod';
import type { DataTableUserOperations } from '../../../../modules/data-table/data-table-proxy.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const searchInputSchema: {
    query: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
};
export declare const createSearchDataTablesTool: (user: User, dataTableOps: DataTableUserOperations, telemetry: Telemetry) => ToolDefinition<typeof searchInputSchema>;
export {};
