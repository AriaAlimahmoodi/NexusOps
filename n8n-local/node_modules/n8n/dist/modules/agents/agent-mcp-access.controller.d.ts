import { ListAgentsQueryDto, UpdateAgentsMcpAvailabilityDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentMcpAccessService } from './agent-mcp-access.service';
export declare class AgentMcpAccessController {
    private readonly agentMcpAccessService;
    constructor(agentMcpAccessService: AgentMcpAccessService);
    getMcpAgents(req: AuthenticatedRequest, res: Response, query: ListAgentsQueryDto): Promise<void>;
    toggleAgentsMCPAccess(req: AuthenticatedRequest, _res: Response, dto: UpdateAgentsMcpAvailabilityDto): Promise<{
        updatedCount: number;
        updatedIds?: string[];
        unchangedIds?: string[];
    }>;
}
