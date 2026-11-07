import type { User } from '@n8n/db';
import { type IConnections } from 'n8n-workflow';
import z from 'zod';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { WorkflowHistoryService } from '../../../workflows/workflow-history/workflow-history.service';
import type { ToolDefinition } from '../mcp.types';
import { type NodeGroupSummary } from './schemas';
declare const inputSchema: {
    workflowId: z.ZodString;
    versionId: z.ZodString;
};
type GetWorkflowVersionParams = {
    workflowId: string;
    versionId: string;
};
type GetWorkflowVersionResult = {
    versionId: string;
    workflowId: string;
    authors: string;
    name: string | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    nodes: Array<Record<string, unknown>>;
    connections: IConnections;
    nodeGroups: NodeGroupSummary[];
};
export declare const createGetWorkflowVersionTool: (user: User, workflowFinderService: WorkflowFinderService, workflowHistoryService: WorkflowHistoryService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export declare function getWorkflowVersion(user: User, workflowFinderService: WorkflowFinderService, workflowHistoryService: WorkflowHistoryService, { workflowId, versionId }: GetWorkflowVersionParams): Promise<GetWorkflowVersionResult>;
export {};
