import type { User } from '@n8n/db';
import z from 'zod';
import type { FolderService } from '../../../services/folder.service';
import type { ProjectService } from '../../../services/project.service.ee';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    projectId: z.ZodString;
    folderId: z.ZodString;
    name: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>>;
    parentFolderId: z.ZodOptional<z.ZodString>;
};
export declare const createUpdateFolderTool: (user: User, folderService: FolderService, projectService: ProjectService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
