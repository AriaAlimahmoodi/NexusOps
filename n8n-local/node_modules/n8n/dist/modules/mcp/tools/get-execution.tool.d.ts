import { type ExecutionRepository, type User } from '@n8n/db';
import z from 'zod';
import type { ToolDefinition } from '../mcp.types';
import type { ExecutionRedactionServiceProxy } from '@n8n/backend-services';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
declare const inputSchema: z.ZodObject<{
    workflowId: z.ZodString;
    executionId: z.ZodString;
    includeData: z.ZodOptional<z.ZodBoolean>;
    nodeNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    truncateData: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    workflowId: string;
    executionId: string;
    includeData?: boolean | undefined;
    nodeNames?: string[] | undefined;
    truncateData?: number | undefined;
}, {
    workflowId: string;
    executionId: string;
    includeData?: boolean | undefined;
    nodeNames?: string[] | undefined;
    truncateData?: number | undefined;
}>;
export declare const createGetExecutionTool: (user: User, executionRepository: ExecutionRepository, workflowFinderService: WorkflowFinderService, telemetry: Telemetry, executionRedactionServiceProxy: ExecutionRedactionServiceProxy) => ToolDefinition<typeof inputSchema.shape>;
export {};
