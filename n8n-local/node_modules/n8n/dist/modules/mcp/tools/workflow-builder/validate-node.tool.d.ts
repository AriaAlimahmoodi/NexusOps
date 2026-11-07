import type { User } from '@n8n/db';
import z from 'zod';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    nodes: z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        typeVersion: z.ZodDefault<z.ZodNumber>;
        parameters: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        subnodes: z.ZodOptional<z.ZodUnknown>;
        isToolNode: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        type: string;
        typeVersion: number;
        parameters: Record<string, unknown>;
        subnodes?: unknown;
        isToolNode?: boolean | undefined;
    }, {
        name?: string | undefined;
        type: string;
        typeVersion?: number | undefined;
        parameters?: Record<string, unknown> | undefined;
        subnodes?: unknown;
        isToolNode?: boolean | undefined;
    }>, "many">;
};
export declare const createValidateNodeTool: (user: User, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
