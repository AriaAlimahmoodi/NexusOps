import type { User } from '@n8n/db';
import z from 'zod';
import type { NodeCatalogService } from '../../../../node-catalog';
import type { AiGatewayService } from '../../../../services/ai-gateway.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    nodeIds: z.ZodArray<z.ZodObject<{
        nodeId: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        resource: z.ZodOptional<z.ZodString>;
        operation: z.ZodOptional<z.ZodString>;
        mode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nodeId: string;
        version?: string | undefined;
        resource?: string | undefined;
        operation?: string | undefined;
        mode?: string | undefined;
    }, {
        nodeId: string;
        version?: string | undefined;
        resource?: string | undefined;
        operation?: string | undefined;
        mode?: string | undefined;
    }>, "many">;
};
export declare const createGetWorkflowNodeTypesTool: (user: User, nodeCatalogService: NodeCatalogService, telemetry: Telemetry, aiGatewayService: AiGatewayService, includeUninstalled?: boolean) => ToolDefinition<typeof inputSchema>;
export {};
