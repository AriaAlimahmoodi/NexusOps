import type { User } from '@n8n/db';
import z from 'zod';
import type { ExecutionListService } from '../../../executions/execution-list.service';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    workflowId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodArray<z.ZodEnum<["canceled", "crashed", "error", "new", "running", "success", "unknown", "waiting"]>, "many">>;
    startedAfter: z.ZodOptional<z.ZodString>;
    startedBefore: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
};
export declare const createSearchExecutionsTool: (user: User, executionListService: ExecutionListService, workflowFinderService: WorkflowFinderService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
