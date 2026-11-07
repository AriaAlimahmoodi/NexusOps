import type { Agent as RuntimeAgent } from '@n8n/agents';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
import type { IAgentConfigurationTelemetryProperties } from '../../interfaces';
import type { PubSubCommandMap } from '../../scaling/pubsub/pubsub.event-map';
import { type AgentSandboxPrincipalHash } from './agent-sandbox-principal';
import { AgentSandboxRuntimeService } from './agent-sandbox-runtime.service';
import { AgentChangePublisher } from './agent-change-publisher.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import { AgentRuntimeReconstructionService } from './agent-runtime-reconstruction.service';
import type { ReconstructedAgentRuntime, UserToolAccessSnapshot } from './agent-runtime-reconstruction.service';
import { AgentRepository } from './repositories/agent.repository';
export interface GetRuntimeParams {
    agentId: string;
    projectId: string;
    integrationType?: string;
    usePublishedVersion?: boolean;
    user?: User;
    sandboxPrincipalHash?: AgentSandboxPrincipalHash;
    allowBackgroundTasks?: boolean;
    attributionUserId?: string;
    previewChat?: boolean;
}
export interface AgentRuntime extends ReconstructedAgentRuntime {
    agentId: string;
    projectId: string;
    telemetryConfiguration: IAgentConfigurationTelemetryProperties;
    userToolAccessSnapshot?: UserToolAccessSnapshot;
    toolAccessCheckedAt: number;
}
export declare class AgentRuntimeCacheService {
    private readonly logger;
    private readonly agentRepository;
    private readonly changePublisher;
    private readonly agentRuntimeReconstructionService;
    private readonly credentialsService;
    private readonly agentSandboxRuntimeService;
    private readonly agentSkillRefs;
    private readonly runtimes;
    private readonly runtimeInitializations;
    private readonly toolAccessRechecks;
    private readonly activeRuntimeLeases;
    private readonly runtimesPendingClose;
    constructor(logger: Logger, agentRepository: AgentRepository, changePublisher: AgentChangePublisher, agentRuntimeReconstructionService: AgentRuntimeReconstructionService, credentialsService: CredentialsService, agentSandboxRuntimeService: AgentSandboxRuntimeService, agentSkillRefs: AgentSkillRefsService);
    private computeRuntimeCacheKey;
    private isRuntimeCacheKeyForAgent;
    clearRuntimes(agentId: string, options?: {
        skipBroadcast?: boolean;
    }): void;
    handleAgentConfigChanged(payload: PubSubCommandMap['agent-config-changed']): void;
    private closeAgentResources;
    private acquireRuntimeLease;
    releaseRuntimeLease(agent: RuntimeAgent): void;
    getRuntime(params: GetRuntimeParams): Promise<AgentRuntime>;
    private toolAccessStillCurrent;
    private reconstructRuntime;
    private acquireCachedRuntime;
    private initializeRuntime;
}
