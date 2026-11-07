import type { User } from '@n8n/db';
import z from 'zod';
import type { CollaborationService } from '../../../collaboration/collaboration.service';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { WorkflowService } from '../../../workflows/workflow.service';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: z.ZodObject<{
    workflowId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    workflowId: string;
}, {
    workflowId: string;
}>;
export declare const createUnpublishWorkflowTool: (user: User, workflowFinderService: WorkflowFinderService, workflowService: WorkflowService, telemetry: Telemetry, collaborationService: CollaborationService) => ToolDefinition<typeof inputSchema.shape>;
export {};
