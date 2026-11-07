import type { User } from '@n8n/db';
import z from 'zod';
import type { FolderService } from '../../../services/folder.service';
import type { ProjectService } from '../../../services/project.service.ee';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    projectId: z.ZodString;
    query: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
};
export declare const createSearchFoldersTool: (user: User, folderService: FolderService, projectService: ProjectService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
