import type { AgentEvalRatingRecord, CreateAgentEvalRatingPayload } from '@n8n/api-types';
import { Logger, ModuleRegistry } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { AgentEvalRatingRepository, AgentEvalResultRepository, AgentEvalRunRepository } from '@n8n/db';
import { AgentRepository } from '../../modules/agents/repositories/agent.repository';
export declare class AgentEvalRatingService {
    private readonly logger;
    private readonly moduleRegistry;
    private readonly ratingRepository;
    private readonly resultRepository;
    private readonly runRepository;
    private readonly agentRepository;
    constructor(logger: Logger, moduleRegistry: ModuleRegistry, ratingRepository: AgentEvalRatingRepository, resultRepository: AgentEvalResultRepository, runRepository: AgentEvalRunRepository, agentRepository: AgentRepository);
    rateResult(user: User, agentId: string, projectId: string, resultId: string, payload: CreateAgentEvalRatingPayload): Promise<AgentEvalRatingRecord>;
    listRatingsForResult(agentId: string, projectId: string, resultId: string): Promise<AgentEvalRatingRecord[]>;
    listLatestRatingsForRun(agentId: string, projectId: string, runId: string): Promise<AgentEvalRatingRecord[]>;
    private assertAgentInProject;
    private resolveResult;
    private resolveRun;
}
