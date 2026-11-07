import { type AgentIntegrationConfig, type ChatIntegrationDescriptor } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
import { AgentModificationTelemetryService, type AgentActor } from './agent-modification-telemetry.service';
import { AgentRuntimeCacheService } from './agent-runtime-cache.service';
import { AgentSetupCompletionService } from './agent-setup-completion.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import type { ProjectAgent } from './entities/agent.entity';
import { ChatIntegrationRegistry } from './integrations/agent-chat-integration';
import { N8nChatFlagService } from './integrations/platforms/n8n-chat-flag.service';
import { AgentRepository } from './repositories/agent.repository';
import type { IntegrationRef } from './utils/agent-channel';
export interface CredentialIntegrationMutationContext {
    user: User;
    modifiedBy: AgentActor;
}
export interface IntegrationDelta {
    add?: AgentIntegrationConfig;
    remove?: IntegrationRef;
}
export interface IntegrationDeltaResult {
    agent: ProjectAgent;
    changed: boolean;
    removed?: AgentIntegrationConfig;
    published?: boolean;
}
export declare function matchesIntegrationRef(integration: IntegrationRef, ref: IntegrationRef): boolean;
export declare class AgentIntegrationPersistenceService {
    private readonly agentRepository;
    private readonly runtimeCacheService;
    private readonly chatIntegrationRegistry;
    private readonly eventService;
    private readonly modificationTelemetry;
    private readonly credentialsService;
    private readonly setupCompletionService;
    private readonly agentSkillRefs;
    private readonly n8nChatFlag;
    constructor(agentRepository: AgentRepository, runtimeCacheService: AgentRuntimeCacheService, chatIntegrationRegistry: ChatIntegrationRegistry, eventService: EventService, modificationTelemetry: AgentModificationTelemetryService, credentialsService: CredentialsService, setupCompletionService: AgentSetupCompletionService, agentSkillRefs: AgentSkillRefsService, n8nChatFlag: N8nChatFlagService);
    listChatIntegrations(): ChatIntegrationDescriptor[];
    listBuilderChatIntegrations(user: User): Promise<ChatIntegrationDescriptor[]>;
    applyIntegrationDelta(agent: ProjectAgent, delta: IntegrationDelta, context: CredentialIntegrationMutationContext): Promise<IntegrationDeltaResult>;
    private validateAddition;
    private recordIntegrationMutation;
    private applyIntegrationAttempt;
    private persistIntegrations;
}
