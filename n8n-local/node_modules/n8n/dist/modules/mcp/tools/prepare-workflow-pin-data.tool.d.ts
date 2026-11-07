import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { type JsonSchema } from '@n8n/workflow-sdk';
import z from 'zod';
import type { ExecutionService } from '../../../executions/execution.service';
import type { NodeTypes } from '../../../node-types';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: z.ZodObject<{
    workflowId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    workflowId: string;
}, {
    workflowId: string;
}>;
export declare const createPrepareTestPinDataTool: (user: User, workflowFinderService: WorkflowFinderService, executionService: ExecutionService, nodeTypes: NodeTypes, telemetry: Telemetry, logger: Logger) => ToolDefinition<typeof inputSchema.shape>;
interface PreparePinDataResult {
    nodeSchemasToGenerate: Record<string, JsonSchema>;
    nodesWithoutSchema: string[];
    nodesSkipped: string[];
    coverage: {
        withSchemaFromExecution: number;
        withSchemaFromDefinition: number;
        withoutSchema: number;
        skipped: number;
        total: number;
    };
}
export declare function preparePinData(workflowId: string, user: User, workflowFinderService: WorkflowFinderService, executionService: ExecutionService, nodeTypes: NodeTypes, logger: Logger): Promise<PreparePinDataResult>;
export {};
