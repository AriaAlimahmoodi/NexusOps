import type { CredentialProvider } from '@n8n/agents';
import type { AgentJsonConfig } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { Telemetry } from '../../telemetry';
import { AgentValidationService } from './agent-validation.service';
import type { Agent } from './entities/agent.entity';
import { type AgentSkillRefs } from './json-config/agent-document';
import { AgentRepository } from './repositories/agent.repository';
type EmitSetupCompleted = () => Promise<void>;
export declare class AgentSetupCompletionService {
    private readonly agentValidationService;
    private readonly telemetry;
    private readonly agentRepository;
    constructor(agentValidationService: AgentValidationService, telemetry: Telemetry, agentRepository: AgentRepository);
    recordIfSetupComplete(agent: Agent, skillRefs: AgentSkillRefs, projectId: string, credentialProvider: CredentialProvider, user?: User): Promise<EmitSetupCompleted | null>;
    recordPublishedSetupComplete(agent: Agent, projectId: string, user: User, config: AgentJsonConfig | null): EmitSetupCompleted | null;
    private isPending;
    private claim;
}
export {};
