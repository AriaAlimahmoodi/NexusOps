import { ListAgentsQueryDto, ListN8nChatThreadsQueryDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentsService } from './agents.service';
export declare class AgentsListController {
    private readonly agentsService;
    constructor(agentsService: AgentsService);
    list(req: AuthenticatedRequest, res: Response, query: ListAgentsQueryDto): Promise<void>;
    getChatAgent(req: AuthenticatedRequest, _res: Response, agentId: string): Promise<import("@n8n/api-types").AgentN8nChatAgentDetails>;
    listN8nChatThreads(req: AuthenticatedRequest, res: Response, query: ListN8nChatThreadsQueryDto): Promise<void>;
    getN8nChatThread(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<import("@n8n/api-types").AgentN8nChatThreadSummary>;
}
