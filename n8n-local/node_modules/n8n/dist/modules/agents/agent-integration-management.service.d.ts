import { type AgentIntegrationConfig, type AgentIntegrationDisconnectWarning } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
import { AgentIntegrationPersistenceService } from './agent-integration-persistence.service';
import type { AgentActor } from './agent-modification-telemetry.service';
import { AgentUpdateBroadcaster } from './agent-update-broadcaster';
import type { ProjectAgent } from './entities/agent.entity';
import { ChatIntegrationRegistry } from './integrations/agent-chat-integration';
import { ChatIntegrationService } from './integrations/chat-integration.service';
import { AgentRepository } from './repositories/agent.repository';
import type { IntegrationRef } from './utils/agent-channel';
export declare class AgentIntegrationManagementService {
    private readonly persistenceService;
    private readonly credentialsService;
    private readonly chatService;
    private readonly registry;
    private readonly logger;
    private readonly agentRepository;
    private readonly agentUpdateBroadcaster;
    private readonly mutations;
    constructor(persistenceService: AgentIntegrationPersistenceService, credentialsService: CredentialsService, chatService: ChatIntegrationService, registry: ChatIntegrationRegistry, logger: Logger, agentRepository: AgentRepository, agentUpdateBroadcaster: AgentUpdateBroadcaster);
    validateConfig(integration: unknown): Promise<AgentIntegrationConfig>;
    connect(options: {
        agent: ProjectAgent;
        user: User;
        integration: unknown;
        replaces?: IntegrationRef;
        modifiedBy?: AgentActor;
        pushRef?: string;
    }): Promise<{
        integration: AgentIntegrationConfig;
        savedAgent: ProjectAgent;
    }>;
    disconnect(options: {
        agent: ProjectAgent;
        user: User;
        type: string;
        credentialId: string;
        deleteExternalResource?: boolean;
        modifiedBy?: AgentActor;
        pushRef?: string;
    }): Promise<{
        savedAgent: ProjectAgent;
        warning?: AgentIntegrationDisconnectWarning;
    }>;
    private applyChange;
    private runChange;
    private cleanupRemovedIntegration;
    private persistChange;
    private startAddedRuntime;
    private loadRuntimeBeforeChange;
    private reconcileRuntimeWithPublication;
    private startRuntimeQuietly;
    private startRuntime;
    private restorePersistedRuntime;
    private releaseRemoved;
    private releaseRuntimeQuietly;
    private assertUsableCredential;
}
