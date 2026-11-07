import { type Agent as RuntimeAgent, type CreateDelegateSubAgentToolOptions, CredentialProvider } from '@n8n/agents';
import { type AgentIntegrationConfig, type BudgetGuardrailConfig, type AgentJsonConfig, type SubAgentSource } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { User } from '@n8n/db';
import { WorkflowRepository } from '@n8n/db';
import { ActiveExecutions } from '../../active-executions';
import { CredentialsFinderService } from '@n8n/backend-services';
import { CredentialsService } from '../../credentials/credentials.service';
import type { AgentRunTelemetryType } from '../../interfaces';
import { EphemeralNodeExecutor } from '../../node-execution';
import { OauthService } from '../../oauth/oauth.service';
import { McpRegistryService } from '../../modules/mcp-registry/registry/mcp-registry.service';
import { AiService } from '../../services/ai.service';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import { AgentKnowledgeMirrorService } from './agent-knowledge-mirror.service';
import type { AgentSandboxPrincipalHash } from './agent-sandbox-principal';
import { AgentSandboxRuntimeService, type AgentSandboxRuntime } from './agent-sandbox-runtime.service';
import { AgentWorkspaceService } from './agent-workspace.service';
import type { AgentRuntimeInstrumentation } from './agent-runtime-instrumentation';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { N8nMemory } from './integrations/n8n-memory';
import { AgentFileRepository } from './repositories/agent-file.repository';
import { AgentRepository } from './repositories/agent.repository';
import { AgentSecureRuntime } from './runtime/agent-secure-runtime';
import { type ReferencedToolKind, type ToolRegistry } from './tool-registry';
import type { WorkflowToolExecutionMode } from './tools/workflow-tool-factory';
import type { AgentRunSource } from './utils/agent-published-snapshot';
import { type AgentRuntimeAssets } from './utils/agent-runtime-assets';
export type AgentRuntimeProfile = 'top-level' | 'sub-agent' | 'inline';
export interface ReconstructedAgentRuntime {
    agent: RuntimeAgent;
    toolRegistry: ToolRegistry;
    mcpServerAttributions: Map<string, string>;
    budget?: BudgetGuardrailConfig;
}
export interface SubAgentDelegationConfig {
    sourcesById: Record<string, SubAgentSource>;
    availableSubAgents: NonNullable<CreateDelegateSubAgentToolOptions['availableSubAgents']>;
}
export interface ReconstructAgentRuntimeParams extends AgentRuntimeAssets {
    config: AgentJsonConfig;
    memoryOwnerAgentId: string;
    projectId: string;
    credentialProvider: CredentialProvider;
    runtimeProfile: AgentRuntimeProfile;
    runType: AgentRunTelemetryType;
    workflowToolExecutionMode?: WorkflowToolExecutionMode;
    parentAgentIdForDelegation?: string;
    integrationType?: string;
    credentialIntegrations?: AgentIntegrationConfig[];
    user?: User;
    attributionUserId?: string;
    instrumentation?: AgentRuntimeInstrumentation;
    sandboxPrincipalHash?: AgentSandboxPrincipalHash;
    parentWorkspace?: {
        handle: AgentSandboxRuntime;
        delegationThreadId: string;
    };
    rootSessionId?: string;
    rootSessionCapUsd?: number;
    budgetForwarded?: boolean;
}
export interface UserToolAccessSnapshot {
    credentialIds: string[];
    workflowIds: string[];
}
export interface UnavailableTool {
    toolName: string;
    toolType: ReferencedToolKind;
    reason: 'not_found' | 'not_published' | 'incompatible' | 'no_access';
    message: string;
}
export declare class AgentRuntimeReconstructionService {
    private readonly logger;
    private readonly agentRepository;
    private readonly agentFileRepository;
    private readonly activeExecutions;
    private readonly workflowRepository;
    private readonly n8nCheckpointStorage;
    private readonly secureRuntime;
    private readonly ephemeralNodeExecutor;
    private readonly n8nMemory;
    private readonly oauthService;
    private readonly mcpRegistryService;
    private readonly agentSandboxRuntimeService;
    private readonly aiService;
    private readonly outboundHttp;
    private readonly agentWorkspaceService;
    private readonly agentKnowledgeMirrorService;
    private readonly credentialsFinderService;
    private readonly workflowFinderService;
    private readonly agentChatAttachmentService;
    private readonly credentialsService;
    constructor(logger: Logger, agentRepository: AgentRepository, agentFileRepository: AgentFileRepository, activeExecutions: ActiveExecutions, workflowRepository: WorkflowRepository, n8nCheckpointStorage: N8NCheckpointStorage, secureRuntime: AgentSecureRuntime, ephemeralNodeExecutor: EphemeralNodeExecutor, n8nMemory: N8nMemory, oauthService: OauthService, mcpRegistryService: McpRegistryService, agentSandboxRuntimeService: AgentSandboxRuntimeService, aiService: AiService, outboundHttp: OutboundHttp, agentWorkspaceService: AgentWorkspaceService, agentKnowledgeMirrorService: AgentKnowledgeMirrorService, credentialsFinderService: CredentialsFinderService, workflowFinderService: WorkflowFinderService, agentChatAttachmentService: AgentChatAttachmentService, credentialsService: CredentialsService);
    reconstructFromAgentEntity({ agent: agentEntity, skillRefs, skills }: AgentRunSource, credentialProvider: CredentialProvider, runType: AgentRunTelemetryType, integrationType?: string, user?: User, instrumentation?: AgentRuntimeInstrumentation, workflowToolExecutionMode?: WorkflowToolExecutionMode, sandboxPrincipalHash?: AgentSandboxPrincipalHash, { supportsHitl, previewChat, allowBackgroundTasks, allowPlanTools, attributionUserId, }?: {
        supportsHitl?: boolean;
        previewChat?: boolean;
        allowBackgroundTasks?: boolean;
        allowPlanTools?: boolean;
        attributionUserId?: string;
    }): Promise<ReconstructedAgentRuntime & {
        userToolAccessSnapshot?: UserToolAccessSnapshot;
    }>;
    private filterToolsForUser;
    private loadAgentUsableCredentialIds;
    private checkToolAccess;
    userStillHasToolAccess(snapshot: UserToolAccessSnapshot, projectId: string, user: User): Promise<boolean>;
    reconstructFromResolvedSource(params: ReconstructAgentRuntimeParams): Promise<ReconstructedAgentRuntime>;
    private reconstructRuntime;
    private buildConfiguredRuntime;
    private createRuntimeToolResolver;
    private makeMcpClientFactory;
    createSubAgentDelegationConfig(config: AgentJsonConfig, projectId: string): Promise<SubAgentDelegationConfig>;
    private getMemoryFactory;
    private resolveManagedEmbeddingProviderOptions;
    private makeToolResolver;
    private resolveWorkflowTool;
    private injectRuntimeDependencies;
    private attachWorkspaceAndKnowledge;
    private attachWorkspace;
    private attachIntegrationTools;
    private createIntegrationDescriptors;
    private createN8nChatDescriptor;
    private attachTopLevelTools;
    private attachSubAgentDelegationTool;
    private resolveInlineSubAgentModelsByDifficulty;
    private attachWriteTodosTool;
    private attachBackgroundJobTools;
    private buildSubAgentPolicy;
}
