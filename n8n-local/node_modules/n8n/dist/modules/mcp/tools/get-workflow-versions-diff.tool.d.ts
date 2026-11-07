import type { User } from '@n8n/db';
import z from 'zod';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { WorkflowHistoryService } from '../../../workflows/workflow-history/workflow-history.service';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    workflowId: z.ZodString;
    fromVersionId: z.ZodString;
    toVersionId: z.ZodString;
};
declare const nodeChangeSummarySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: string;
}, {
    id: string;
    name: string;
    type: string;
}>;
declare const modifiedNodeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
} & {
    changes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: string;
    changes: Record<string, unknown>;
}, {
    id: string;
    name: string;
    type: string;
    changes: Record<string, unknown>;
}>;
declare const connectionChangeSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    type: z.ZodString;
    fromOutput: z.ZodNumber;
    toInput: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    from: string;
    to: string;
    type: string;
    fromOutput: number;
    toInput: number;
}, {
    from: string;
    to: string;
    type: string;
    fromOutput: number;
    toInput: number;
}>;
type GetWorkflowVersionsDiffParams = {
    workflowId: string;
    fromVersionId: string;
    toVersionId: string;
};
type NodeChangeSummary = z.infer<typeof nodeChangeSummarySchema>;
type ModifiedNode = z.infer<typeof modifiedNodeSchema>;
type ConnectionChange = z.infer<typeof connectionChangeSchema>;
type GetWorkflowVersionsDiffResult = {
    workflowId: string;
    fromVersionId: string;
    toVersionId: string;
    nodesAdded: Array<Record<string, unknown>>;
    nodesRemoved: NodeChangeSummary[];
    nodesModified: ModifiedNode[];
    connectionsAdded: ConnectionChange[];
    connectionsRemoved: ConnectionChange[];
};
export declare const createGetWorkflowVersionsDiffTool: (user: User, workflowFinderService: WorkflowFinderService, workflowHistoryService: WorkflowHistoryService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export declare function getWorkflowVersionsDiff(user: User, workflowFinderService: WorkflowFinderService, workflowHistoryService: WorkflowHistoryService, { workflowId, fromVersionId, toVersionId }: GetWorkflowVersionsDiffParams): Promise<GetWorkflowVersionsDiffResult>;
export {};
