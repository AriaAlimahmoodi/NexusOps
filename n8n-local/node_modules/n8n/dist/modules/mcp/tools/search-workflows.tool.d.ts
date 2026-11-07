import { type User } from '@n8n/db';
import z from 'zod';
import type { ToolDefinition, SearchWorkflowsParams, SearchWorkflowsResult } from '../mcp.types';
import type { FolderFinderService } from '@n8n/backend-services';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowService } from '../../../workflows/workflow.service';
declare const inputSchema: {
    limit: z.ZodOptional<z.ZodNumber>;
    query: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sortBy: z.ZodOptional<z.ZodEnum<["updatedAt:desc", "updatedAt:asc", "createdAt:desc", "createdAt:asc", "name:asc", "name:desc"]>>;
    folderId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    includeSubfolders: z.ZodOptional<z.ZodBoolean>;
};
export declare const createSearchWorkflowsTool: (user: User, workflowService: WorkflowService, folderFinderService: FolderFinderService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export declare function searchWorkflows(user: User, workflowService: WorkflowService, folderFinderService: FolderFinderService, { limit, query, projectId, tags, sortBy, folderId, includeSubfolders, }: SearchWorkflowsParams): Promise<SearchWorkflowsResult>;
export {};
