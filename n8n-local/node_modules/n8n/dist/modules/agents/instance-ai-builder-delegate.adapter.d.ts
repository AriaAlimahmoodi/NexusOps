import type { CredentialProvider } from '@n8n/agents';
import type { User } from '@n8n/db';
import { type InstanceAiBuilderDelegate, type InstanceAiCredentialService } from '@n8n/instance-ai';
import { AgentConfigService } from './agent-config.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import { AgentSkillsService } from './agent-skills.service';
import { AgentValidationService } from './agent-validation.service';
import { AgentsService } from './agents.service';
import { AgentsSettingsService } from './agents-settings.service';
import { AgentsBuilderToolsService } from './builder/agents-builder-tools.service';
import { N8nMemory } from './integrations/n8n-memory';
import { AgentThreadRepository } from './repositories/agent-thread.repository';
export declare class InstanceAiBuilderDelegateAdapterService {
    private readonly agentsService;
    private readonly agentsBuilderToolsService;
    private readonly n8nMemory;
    private readonly agentThreadRepository;
    private readonly agentConfig;
    private readonly agentSkills;
    private readonly agentsSettingsService;
    private readonly agentValidation;
    private readonly agentSkillRefs;
    constructor(agentsService: AgentsService, agentsBuilderToolsService: AgentsBuilderToolsService, n8nMemory: N8nMemory, agentThreadRepository: AgentThreadRepository, agentConfig: AgentConfigService, agentSkills: AgentSkillsService, agentsSettingsService: AgentsSettingsService, agentValidation: AgentValidationService, agentSkillRefs: AgentSkillRefsService);
    createDelegate(user: User, projectId: string, credentialProviderFor: (agentId: string) => CredentialProvider, credentialService: InstanceAiCredentialService, options?: {
        useEvalModelCatalog?: boolean;
    }): InstanceAiBuilderDelegate;
    deleteBuilderSessions(instanceAiThreadId: string): Promise<void>;
}
