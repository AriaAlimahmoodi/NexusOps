import type { User } from '@n8n/db';
import z from 'zod';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { WorkflowHistoryService } from '../../../workflows/workflow-history/workflow-history.service';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    workflowId: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
};
declare const versionSummarySchema: z.ZodObject<{
    versionId: z.ZodString;
    authors: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    autosaved: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    versionId: string;
    authors: string;
    name: string | null;
    description: string | null;
    autosaved: boolean;
    createdAt: string;
    updatedAt: string;
}, {
    versionId: string;
    authors: string;
    name: string | null;
    description: string | null;
    autosaved: boolean;
    createdAt: string;
    updatedAt: string;
}>;
type GetWorkflowHistoryParams = {
    workflowId: string;
    limit?: number;
    offset?: number;
};
type GetWorkflowHistoryResult = {
    workflowId: string;
    versions: Array<z.infer<typeof versionSummarySchema>>;
    count: number;
};
export declare const createGetWorkflowHistoryTool: (user: User, workflowFinderService: WorkflowFinderService, workflowHistoryService: WorkflowHistoryService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export declare function getWorkflowHistory(user: User, workflowFinderService: WorkflowFinderService, workflowHistoryService: WorkflowHistoryService, { workflowId, limit, offset }: GetWorkflowHistoryParams): Promise<GetWorkflowHistoryResult>;
export {};
