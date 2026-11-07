import { type Agent as RuntimeAgent } from '@n8n/agents';
import type { AgentBackgroundJobSignal, AgentMessageAuthor, AgentChatMessagesResponse, BudgetGuardrailConfig, AgentBudgetNotice } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { AiConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { ExternalHooks } from '../../external-hooks';
import type { AgentRunTelemetryType, IAgentConfigurationTelemetryProperties } from '../../interfaces';
import { Telemetry } from '../../telemetry';
import { AgentExecutionService } from './agent-execution.service';
import { AgentChatExecutionService, type CancelSuspendedRunParams } from './agent-chat-execution.service';
import type { AgentThreadAccess } from './entities/agent-execution-thread.entity';
import type { AgentChatSurface, AgentSessionMode } from './utils/agent-thread-access';
import { AgentRunTracingService } from './agent-run-tracing.service';
import { AgentRuntimeCacheService } from './agent-runtime-cache.service';
import { type AgentSandboxPrincipalHash } from './agent-sandbox-principal';
import { AgentSandboxRuntimeService } from './agent-sandbox-runtime.service';
import { AgentsSettingsService } from './agents-settings.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import { AgentTurnExecutionService } from './agent-turn-execution.service';
import type { IntegrationMessageContext, SessionBinding } from './integrations/integration-tool-types';
import { IntegrationMessageContextService } from './integrations/integration-message-context.service';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import { AgentRepository } from './repositories/agent.repository';
import { AgentBackgroundJobRepository } from './repositories/agent-background-job.repository';
import { AgentBackgroundJobService } from './background/agent-background-job.service';
import type { ToolRegistry } from './tool-registry';
import type { StoredAttachmentRef } from './types/agent-chat-attachment';
import type { AgentExecutionAdmission } from './types/agent-queued-message';
import type { AgentExecutionStreamChunk } from './types/agent-steering';
export interface AgentMemoryScope {
    threadId: string;
    resourceId: string;
}
interface AgentExecutionInput {
    agentId: string;
    projectId: string;
    message: string;
    memory: AgentMemoryScope;
}
interface ChatExecutionInput extends AgentExecutionInput {
    admittedExecution?: AgentExecutionAdmission;
    abortSignal?: AbortSignal;
    sessionMode?: AgentSessionMode;
    attachments?: StoredAttachmentRef[];
}
interface ChatExecutionCallbacks {
    onExecutionStarted?: (executionId: string, sessionId: string, inputMessageIds: string[]) => void;
    onExecutionRecorded?: (executionId: string) => void;
}
export interface ExecuteForChatConfig extends ChatExecutionInput, ChatExecutionCallbacks {
    user: User;
    source?: string;
    previewChat?: boolean;
    onBudgetNotice?: (notice: AgentBudgetNotice) => void;
    abortSignal?: AbortSignal;
}
export interface ExecuteForChatPublishedConfig extends ChatExecutionInput {
    messageContext?: IntegrationMessageContext | null;
    contextConversation?: SessionBinding;
    modelMessage?: string;
    author?: AgentMessageAuthor;
    integrationType?: string;
    sandboxPrincipalHash: AgentSandboxPrincipalHash;
}
export interface ExecuteForN8nChatPublishedConfig extends ChatExecutionInput, ChatExecutionCallbacks {
    user: User;
    abortSignal?: AbortSignal;
}
export interface ResumeForChatConfig extends ChatExecutionCallbacks {
    messageContext?: IntegrationMessageContext | null;
    contextConversation?: SessionBinding;
    agentId: string;
    projectId: string;
    runId: string;
    toolCallId: string;
    resumeData: unknown;
    expectedMemory?: Partial<AgentMemoryScope>;
    source?: string;
    user?: User;
    usePublishedVersion?: boolean;
    integrationType?: string;
    chatSurface?: AgentChatSurface;
    onBudgetNotice?: (notice: AgentBudgetNotice) => void;
    automaticPreviewContinuation?: boolean;
    abortSignal?: AbortSignal;
}
export interface ExecuteForTaskPublishedConfig extends AgentExecutionInput {
    taskId: string;
    taskVersionId: string;
}
export interface ExecuteForTaskNowConfig extends AgentExecutionInput {
    user: User;
    taskId: string;
}
export interface ExecuteForWakeConfig extends AgentExecutionInput {
    backgroundJobSignal: AgentBackgroundJobSignal;
    pauseReport?: boolean;
    abortSignal: AbortSignal;
    identity: {
        type: 'draft';
        user: User;
        principalHash: AgentSandboxPrincipalHash;
    } | {
        type: 'published';
        integrationType: string;
        principalHash: AgentSandboxPrincipalHash;
    };
}
export interface StreamChatResponseConfig extends ChatExecutionInput, ChatExecutionCallbacks {
    onAdmitted?: () => Promise<void>;
    access: AgentThreadAccess;
    messageContext?: IntegrationMessageContext | null;
    agentInstance: RuntimeAgent;
    toolRegistry: ToolRegistry;
    budget?: BudgetGuardrailConfig;
    mcpServerAttributions: Map<string, string>;
    userId?: string;
    modelMessage?: string;
    author?: AgentMessageAuthor;
    source?: string;
    taskId?: string;
    taskVersionId?: string;
    telemetry: {
        runType: AgentRunTelemetryType;
        configuration: IAgentConfigurationTelemetryProperties;
    };
    chatSurface?: AgentChatSurface;
    onBudgetNotice?: (notice: AgentBudgetNotice) => void;
    abortSignal?: AbortSignal;
    sandboxPrincipalHash: AgentSandboxPrincipalHash;
    hideUserMessageFromTranscript?: boolean;
    isWakeRun?: boolean;
    pauseReport?: boolean;
    backgroundJobSignal?: AgentBackgroundJobSignal;
}
export declare class AgentExecutionOrchestratorService {
    private readonly logger;
    private readonly n8nCheckpointStorage;
    private readonly agentExecutionService;
    private readonly turnExecutionService;
    private readonly telemetry;
    private readonly runtimeCacheService;
    private readonly integrationMessageContextService;
    private readonly agentRunTracingService;
    private readonly externalHooks;
    private readonly agentSandboxRuntimeService;
    private readonly agentRepository;
    private readonly aiConfig;
    private readonly chatExecutionService;
    private readonly backgroundJobRepository;
    private readonly backgroundJobService;
    private readonly settingsService;
    private readonly agentSkillRefs;
    constructor(logger: Logger, n8nCheckpointStorage: N8NCheckpointStorage, agentExecutionService: AgentExecutionService, turnExecutionService: AgentTurnExecutionService, telemetry: Telemetry, runtimeCacheService: AgentRuntimeCacheService, integrationMessageContextService: IntegrationMessageContextService, agentRunTracingService: AgentRunTracingService, externalHooks: ExternalHooks, agentSandboxRuntimeService: AgentSandboxRuntimeService, agentRepository: AgentRepository, aiConfig: AiConfig, chatExecutionService: AgentChatExecutionService, backgroundJobRepository: AgentBackgroundJobRepository, backgroundJobService: AgentBackgroundJobService, settingsService: AgentsSettingsService, agentSkillRefs: AgentSkillRefsService);
    getSessionMode(threadId: string): Promise<AgentSessionMode>;
    getConversationHistory(params: {
        threadId: string;
        projectId: string;
        agentId: string;
        userId: string;
    }): Promise<Pick<AgentChatMessagesResponse, 'messages' | 'activeExecutionId'> | null>;
    cancelChatRun(params: CancelSuspendedRunParams): Promise<boolean>;
    private loadResumeCheckpoint;
    private loadResumeMemory;
    private resolveResumeScope;
    private checkResumeSandbox;
    resumeForChat(config: ResumeForChatConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    resumeBackgroundForChat(config: ResumeForChatConfig): Promise<boolean>;
    deliverBackgroundApproval(config: Pick<ExecuteForWakeConfig, 'agentId' | 'projectId' | 'memory' | 'identity'>, title: string, approval: NonNullable<Awaited<ReturnType<AgentBackgroundJobService['getApproval']>>>): Promise<void>;
    executeForChat(config: ExecuteForChatConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    executeForChatPublished(config: ExecuteForChatPublishedConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    executeForN8nChatPublished(config: ExecuteForN8nChatPublishedConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    executeForTaskPublished(config: ExecuteForTaskPublishedConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    executeForTaskNow(config: ExecuteForTaskNowConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    executeForWake(config: ExecuteForWakeConfig): Promise<void>;
    private streamWakeResponse;
    private getWakeDelivery;
    streamChatResponse(config: StreamChatResponseConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    private withRuntimeLease;
    private requestPendingBackgroundWake;
    private getRuntimeOrRecordFailure;
    private getResumeRuntime;
    private resumeRuntimeTurn;
    private prepareChatResume;
    private getResumeTracing;
    private createResumeOptions;
    private createResumeRecording;
    private resolveResumeMessageContext;
    private preparePreviewChat;
    private prepareN8nChat;
    private getDraftChatRuntime;
    private streamDraftChatResponse;
    private createN8nChatMessageContext;
    private prepareChatTurn;
    private createChatRecording;
    private getWakeRuntime;
    private streamWakeTurn;
}
export {};
