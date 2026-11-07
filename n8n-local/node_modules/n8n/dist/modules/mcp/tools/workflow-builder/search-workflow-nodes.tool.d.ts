import type { User } from '@n8n/db';
import z from 'zod';
import type { NodeCatalogService } from '../../../../node-catalog';
import type { AiGatewayService } from '../../../../services/ai-gateway.service';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    queries: z.ZodArray<z.ZodString, "many">;
    usage: z.ZodOptional<z.ZodEnum<["workflow", "agentTool"]>>;
};
type SearchNodesInput = {
    queries: string[];
    usage?: 'workflow' | 'agentTool';
};
type SearchNodesCallback = ToolDefinition<typeof inputSchema>['handler'];
type SearchNodesToolDefinition = Omit<ToolDefinition<typeof inputSchema>, 'handler'> & {
    handler: (input: SearchNodesInput, extra: Parameters<SearchNodesCallback>[1]) => ReturnType<SearchNodesCallback>;
};
export declare const createSearchWorkflowNodesTool: (user: User, nodeCatalogService: NodeCatalogService, telemetry: Telemetry, aiGatewayService: AiGatewayService, includeUninstalled?: boolean) => SearchNodesToolDefinition;
export {};
