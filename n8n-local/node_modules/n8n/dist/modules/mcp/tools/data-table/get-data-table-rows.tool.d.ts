import type { User } from '@n8n/db';
import z from 'zod';
import type { DataTableUserOperations } from '../../../../modules/data-table/data-table-proxy.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const getRowsInputSchema: {
    dataTableId: z.ZodString;
    projectId: z.ZodString;
    filter: z.ZodOptional<z.ZodObject<{
        type: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"and">, z.ZodLiteral<"or">]>>;
        filters: z.ZodArray<z.ZodObject<{
            columnName: z.ZodString;
            condition: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"eq">, z.ZodLiteral<"neq">, z.ZodLiteral<"like">, z.ZodLiteral<"ilike">, z.ZodLiteral<"gt">, z.ZodLiteral<"gte">, z.ZodLiteral<"lt">, z.ZodLiteral<"lte">, z.ZodLiteral<"isEmpty">, z.ZodLiteral<"isNotEmpty">]>>;
            value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
        }, "strip", z.ZodTypeAny, {
            columnName: string;
            condition: "eq" | "gt" | "gte" | "ilike" | "isEmpty" | "isNotEmpty" | "like" | "lt" | "lte" | "neq";
            value: string | number | boolean | null;
        }, {
            columnName: string;
            condition?: "eq" | "gt" | "gte" | "ilike" | "isEmpty" | "isNotEmpty" | "like" | "lt" | "lte" | "neq" | undefined;
            value: string | number | boolean | null;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "and" | "or";
        filters: {
            columnName: string;
            condition: "eq" | "gt" | "gte" | "ilike" | "isEmpty" | "isNotEmpty" | "like" | "lt" | "lte" | "neq";
            value: string | number | boolean | null;
        }[];
    }, {
        type?: "and" | "or" | undefined;
        filters: {
            columnName: string;
            condition?: "eq" | "gt" | "gte" | "ilike" | "isEmpty" | "isNotEmpty" | "like" | "lt" | "lte" | "neq" | undefined;
            value: string | number | boolean | null;
        }[];
    }>>;
    sortBy: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    limit: z.ZodOptional<z.ZodNumber>;
    skip: z.ZodOptional<z.ZodNumber>;
};
export declare const createGetDataTableRowsTool: (user: User, dataTableOps: DataTableUserOperations, telemetry: Telemetry) => ToolDefinition<typeof getRowsInputSchema>;
export {};
