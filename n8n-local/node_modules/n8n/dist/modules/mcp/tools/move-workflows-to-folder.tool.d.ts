import type { User } from '@n8n/db';
import z from 'zod';
import type { FolderFinderService } from '@n8n/backend-services';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { WorkflowService } from '../../../workflows/workflow.service';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    workflowIds: z.ZodArray<z.ZodString, "many">;
    folderId: z.ZodString;
};
export declare const createMoveWorkflowsToFolderTool: (user: User, workflowFinderService: WorkflowFinderService, workflowService: WorkflowService, folderFinderService: FolderFinderService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
