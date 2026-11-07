import { type AgentConfigValidationResponse, type AgentVersionListItemDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { TransactionRunner, type User } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
import { Telemetry } from '../../telemetry';
import { AgentDefinitionService } from './agent-definition.service';
import { AgentSaveCompletionService } from './agent-save-completion.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import type { AgentDefinition } from './utils/agent-definition';
import { AgentCustomToolsService } from './agent-custom-tools.service';
import { type AgentActor } from './agent-modification-telemetry.service';
import { AgentPolicyService } from './agent-policy.service';
import { AgentRuntimeCacheService } from './agent-runtime-cache.service';
import { AgentSetupCompletionService } from './agent-setup-completion.service';
import { AgentUpdateBroadcaster } from './agent-update-broadcaster';
import { AgentValidationService } from './agent-validation.service';
import type { AgentHistory } from './entities/agent-history.entity';
import type { ProjectAgent } from './entities/agent.entity';
import { AgentHistoryRepository } from './repositories/agent-history.repository';
import { AgentTaskSnapshotRepository } from './repositories/agent-task-snapshot.repository';
import { AgentTaskRepository } from './repositories/agent-task.repository';
import { AgentRepository } from './repositories/agent.repository';
export type AgentPublishTrigger = 'explicit' | 'republish';
export interface AgentPublishEmitter {
    by: AgentActor;
    trigger: Exclude<AgentPublishTrigger, 'republish'>;
}
export type ValidAgentConfigValidationResponse = AgentConfigValidationResponse & {
    status: 'valid';
};
export interface PublishAgentResult {
    agent: ProjectAgent;
    draftValidation?: ValidAgentConfigValidationResponse;
}
export declare class AgentPublishService {
    private readonly logger;
    private readonly agentRepository;
    private readonly agentHistoryRepository;
    private readonly agentTaskSnapshotRepository;
    private readonly agentTaskRepository;
    private readonly customToolsService;
    private readonly runtimeCacheService;
    private readonly agentValidationService;
    private readonly credentialsService;
    private readonly telemetry;
    private readonly eventService;
    private readonly setupCompletionService;
    private readonly agentUpdateBroadcaster;
    private readonly transactionRunner;
    private readonly saveCompletion;
    private readonly definitionService;
    private readonly agentPolicyService;
    private readonly agentSkillRefs;
    constructor(logger: Logger, agentRepository: AgentRepository, agentHistoryRepository: AgentHistoryRepository, agentTaskSnapshotRepository: AgentTaskSnapshotRepository, agentTaskRepository: AgentTaskRepository, customToolsService: AgentCustomToolsService, runtimeCacheService: AgentRuntimeCacheService, agentValidationService: AgentValidationService, credentialsService: CredentialsService, telemetry: Telemetry, eventService: EventService, setupCompletionService: AgentSetupCompletionService, agentUpdateBroadcaster: AgentUpdateBroadcaster, transactionRunner: TransactionRunner, saveCompletion: AgentSaveCompletionService, definitionService: AgentDefinitionService, agentPolicyService: AgentPolicyService, agentSkillRefs: AgentSkillRefsService);
    publishAgent(agentId: string, projectId: string, user: User, emitter: AgentPublishEmitter, versionId?: string, pushRef?: string): Promise<PublishAgentResult>;
    private assertPublishable;
    private assertChannelsStartable;
    unpublishAgent(agentId: string, projectId: string, user: User, by: AgentActor, pushRef?: string): Promise<ProjectAgent>;
    private trackPublished;
    private trackUnpublished;
    revertToPublishedAgent(agentId: string, projectId: string, user: User, modifiedBy: AgentActor, pushRef?: string): Promise<ProjectAgent>;
    revertToVersion(agentId: string, projectId: string, versionId: string, user: User, modifiedBy: AgentActor, pushRef?: string): Promise<ProjectAgent>;
    private enforceRevertPolicy;
    private restoreVersion;
    hasPublishHistory(agentId: string): Promise<boolean>;
    getVersion(agentId: string, projectId: string, versionId: string): Promise<{
        agent: ProjectAgent;
        version: AgentHistory;
        definition: AgentDefinition;
    }>;
    listPublishHistory(agentId: string, projectId: string, take: number, skip: number): Promise<AgentVersionListItemDto[]>;
    private snapshotConfiguredTasks;
    private readPublishTargetDocument;
    private startPublishedServices;
    private commitUnpublication;
    private findPublishTarget;
    private commitPublication;
    private preparePublishedVersion;
    private saveDraftHistory;
}
