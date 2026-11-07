import type { User } from '@n8n/db';
import { type IPinData } from 'n8n-workflow';
import z from 'zod';
import type { ActiveExecutions } from '../../../active-executions';
import type { McpService } from '../../../modules/mcp/mcp.service';
import type { NodeTypes } from '../../../node-types';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowRunner } from '../../../workflow-runner';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: z.ZodObject<{
    workflowId: z.ZodString;
    pinData: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    triggerNodeName: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    workflowId: string;
    pinData: Record<string, Record<string, unknown>[]>;
    triggerNodeName?: string | undefined;
    timeout?: number | undefined;
}, {
    workflowId: string;
    pinData: Record<string, Record<string, unknown>[]>;
    triggerNodeName?: string | undefined;
    timeout?: number | undefined;
}>;
type TestWorkflowOutput = {
    executionId: string | null;
    status: 'success' | 'error' | 'running' | 'waiting' | 'canceled' | 'crashed' | 'new' | 'unknown';
    error?: string;
};
export declare const createTestWorkflowTool: (user: User, workflowFinderService: WorkflowFinderService, activeExecutions: ActiveExecutions, workflowRunner: WorkflowRunner, nodeTypes: NodeTypes, telemetry: Telemetry, mcpService: McpService) => ToolDefinition<typeof inputSchema.shape>;
export declare function testWorkflow(user: User, workflowFinderService: WorkflowFinderService, activeExecutions: ActiveExecutions, workflowRunner: WorkflowRunner, nodeTypes: NodeTypes, mcpService: McpService, workflowId: string, pinData: IPinData, triggerNodeName?: string, timeoutSeconds?: number): Promise<TestWorkflowOutput>;
export {};
