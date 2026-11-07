import { Logger } from '@n8n/backend-common';
import { AgentRuntimeCacheService } from '../agent-runtime-cache.service';
import { AgentRepository } from '../repositories/agent.repository';
export declare class SubAgentCleanupService {
    private readonly logger;
    private readonly agentRepository;
    private readonly runtimeCacheService;
    constructor(logger: Logger, agentRepository: AgentRepository, runtimeCacheService: AgentRuntimeCacheService);
    removeSubAgentFromParents(childAgentId: string, projectId: string): Promise<void>;
    private removeSubAgentFromParent;
}
