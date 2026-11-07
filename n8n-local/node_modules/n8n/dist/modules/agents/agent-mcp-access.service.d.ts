import type { ListAgentsQueryDto, UpdateAgentsMcpAvailabilityDto } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { CollaborationService } from '../../collaboration/collaboration.service';
import { ProjectScopeService } from '@n8n/backend-services';
import { AgentRepository, type AgentListResult } from './repositories/agent.repository';
type BulkSetAvailableInMCPResult = {
    updatedCount: number;
    updatedIds?: string[];
    unchangedIds?: string[];
};
export declare class AgentMcpAccessService {
    private readonly agentRepository;
    private readonly projectScopeService;
    private readonly collaborationService;
    constructor(agentRepository: AgentRepository, projectScopeService: ProjectScopeService, collaborationService: CollaborationService);
    getAgents(user: User, options: ListAgentsQueryDto): Promise<AgentListResult>;
    bulkSetAvailableInMCP(user: User, dto: UpdateAgentsMcpAvailabilityDto, pushRef: string | undefined): Promise<BulkSetAvailableInMCPResult>;
    private resolveCandidates;
}
export {};
