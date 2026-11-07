import type { AgentSkill } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
import { AgentPublishService, type ValidAgentConfigValidationResponse } from './agent-publish.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import { AgentValidationService } from './agent-validation.service';
import type { Agent } from './entities/agent.entity';
export declare class AgentRunnableStateService {
    private readonly credentialsService;
    private readonly agentValidationService;
    private readonly agentPublishService;
    private readonly agentSkillRefs;
    constructor(credentialsService: CredentialsService, agentValidationService: AgentValidationService, agentPublishService: AgentPublishService, agentSkillRefs: AgentSkillRefsService);
    addRunnableState(agent: Agent, projectId: string, user: User, draftValidation?: ValidAgentConfigValidationResponse): Promise<Agent & {
        isRunnable: boolean;
        hasPublishHistory: boolean;
        configHash: string | null;
        skills: Record<string, AgentSkill>;
        skillHashes: Record<string, string>;
        outdatedSkillIds: string[];
    }>;
}
