import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentKnowledgeService } from './agent-knowledge.service';
import { AgentSandboxRuntimeService } from './agent-sandbox-runtime.service';
export declare class AgentSandboxController {
    private readonly agentKnowledgeService;
    private readonly logger;
    private readonly agentSandboxRuntimeService;
    constructor(agentKnowledgeService: AgentKnowledgeService, logger: Logger, agentSandboxRuntimeService: AgentSandboxRuntimeService);
    warmKnowledgeSandbox(_req: AuthenticatedRequest<{
        projectId: string;
    }>, res: Response, projectId: string, agentId: string): Promise<{
        accepted: true;
    }>;
    private assertKnowledgeBaseEnabled;
    private warmKnowledgeSandboxInBackground;
}
