import type { User } from '@n8n/db';
import z from 'zod';
import type { WorkflowDependencyQueryService } from '../../../modules/workflow-index/workflow-dependency-query.service';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
export declare const GET_NODE_USAGE_TOOL_NAME = "get_node_usage";
declare const inputSchema: {
    nodeType: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
};
export declare const createGetNodeUsageTool: (user: User, workflowDependencyQueryService: WorkflowDependencyQueryService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
