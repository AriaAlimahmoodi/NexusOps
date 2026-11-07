import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentKnowledgeService } from './agent-knowledge.service';
import { AgentRuntimeCacheService } from './agent-runtime-cache.service';
import { AgentSandboxRuntimeService } from './agent-sandbox-runtime.service';
export declare class AgentKnowledgeController {
    private readonly agentKnowledgeService;
    private readonly agentSandboxRuntimeService;
    private readonly runtimeCacheService;
    constructor(agentKnowledgeService: AgentKnowledgeService, agentSandboxRuntimeService: AgentSandboxRuntimeService, runtimeCacheService: AgentRuntimeCacheService);
    private assertKnowledgeBaseEnabled;
    listFiles(_req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, projectId: string, agentId: string): Promise<import("@n8n/api-types").AgentFileDto[]>;
    uploadFiles(req: AuthenticatedRequest<{
        projectId: string;
    }> & {
        files?: Express.Multer.File[];
        fileUploadError?: Error;
    }, _res: Response, projectId: string, agentId: string): Promise<import("@n8n/api-types").AgentFileDto[]>;
    deleteFile(_req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, projectId: string, agentId: string, fileId: string): Promise<{
        success: boolean;
    }>;
}
