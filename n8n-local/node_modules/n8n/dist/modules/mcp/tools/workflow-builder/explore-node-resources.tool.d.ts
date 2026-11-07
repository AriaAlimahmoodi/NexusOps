import type { User } from '@n8n/db';
import z from 'zod';
import type { ToolDefinition } from '../../mcp.types';
import type { NodeResourceExplorerService } from '../../../../services/node-resource-explorer.service';
import type { Telemetry } from '../../../../telemetry';
declare const inputSchema: {
    nodeType: z.ZodString;
    version: z.ZodNumber;
    methodName: z.ZodString;
    methodType: z.ZodEnum<["listSearch", "loadOptions"]>;
    credentialType: z.ZodString;
    credentialId: z.ZodString;
    filter: z.ZodOptional<z.ZodString>;
    paginationToken: z.ZodOptional<z.ZodString>;
    currentNodeParameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare const createExploreNodeResourcesTool: (user: User, nodeResourceExplorerService: NodeResourceExplorerService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
