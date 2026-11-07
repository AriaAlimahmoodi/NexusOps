import { InstanceAiFeedbackRequestDto, InstanceAiGatewayCapabilitiesDto, InstanceAiGatewayCreateCredentialDto, InstanceAiFilesystemResponseDto, InstanceAiRenameThreadRequestDto, InstanceAiThreadTabsRequestDto, InstanceAiPreferenceCardEditRequestDto, InstanceAiPreferenceCardUndoRequestDto, InstanceAiSendMessageRequest, InstanceAiEventsQuery, InstanceAiCorrectTaskRequest, InstanceAiEnsureThreadRequest, InstanceAiPersistPendingAgentRequest, InstanceAiThreadMessagesQuery, InstanceAiThreadHistoryQuery, InstanceAiAdminSettingsUpdateRequest, InstanceAiVerifyModelRequest, InstanceAiVerifySandboxRequest, InstanceAiVerifySearchRequest, InstanceAiUserPreferencesUpdateRequest, InstanceAiEvalExecutionRequest, InstanceAiEvalAgentExecutionRequest, InstanceAiEvalCredentialAllowlistRequest, InstanceAiEvalCredentialTestTargetRequest, InstanceAiEvalRestoreThreadRequest, InstanceAiEvalSeedDataTableRowsRequest } from '@n8n/api-types';
import type { InstanceAiAdminSettingsResponse, InstanceAiEvalThreadMemoryResponse, InstanceAiThreadTabsResponse } from '@n8n/api-types';
import { ModuleRegistry } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { AuthenticatedRequest, UserRepository } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import { InstanceAiBrowserSessionService } from './browser/instance-ai-browser-session.service';
import { EvalAgentExecutionService } from './eval/agent-execution.service';
import { EvalExecutionService } from './eval/execution.service';
import { EvalThreadCredentialAllowlistService } from './eval/thread-credential-allowlist.service';
import { EvalThreadRestoreService } from './eval/thread-restore.service';
import { DurableEventLog } from './event-bus/durable-event-log';
import { DurableLogMetrics } from './event-bus/durable-log-metrics';
import { InProcessEventBus } from './event-bus/in-process-event-bus';
import { InstanceAiErrorReporterService } from './instance-ai-error-reporter.service';
import { InstanceAiGatewayService } from './instance-ai-gateway.service';
import { InstanceAiMemoryService } from './instance-ai-memory.service';
import { InstanceAiModelCatalogService } from './instance-ai-model-catalog.service';
import { InstanceAiPendingAgentService } from './instance-ai-pending-agent.service';
import { InstanceAiPreferenceCardService } from './instance-ai-preference-card.service';
import { InstanceAiSettingsService } from './instance-ai-settings.service';
import { InstanceAiThreadTabsService } from './instance-ai-thread-tabs.service';
import { InstanceAiService } from './instance-ai.service';
import { InstanceAiOnboardingService } from './onboarding';
import { CredentialsService } from '../../credentials/credentials.service';
import { Push } from '../../push';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { ProjectService } from '../../services/project.service.ee';
import { UrlService } from '@n8n/backend-services';
type FlushableResponse = Response & {
    flush?: () => void;
};
export declare class InstanceAiController {
    private readonly instanceAiService;
    private readonly gatewayService;
    private readonly browserSessionService;
    private readonly memoryService;
    private readonly onboarding;
    private readonly pendingAgentService;
    private readonly settingsService;
    private readonly modelCatalogService;
    private readonly evalExecutionService;
    private readonly evalAgentExecutionService;
    private readonly evalCredentialAllowlists;
    private readonly evalThreadRestore;
    private readonly eventBus;
    private readonly eventLog;
    private readonly durableLogMetrics;
    private readonly moduleRegistry;
    private readonly push;
    private readonly urlService;
    private readonly userRepository;
    private readonly credentialsService;
    private readonly projectService;
    private readonly instanceAiErrorReporter;
    private readonly publisher;
    private readonly preferenceCardService;
    private readonly threadTabsService;
    private readonly gatewayApiKey;
    private readonly instanceAiConfig;
    constructor(instanceAiService: InstanceAiService, gatewayService: InstanceAiGatewayService, browserSessionService: InstanceAiBrowserSessionService, memoryService: InstanceAiMemoryService, onboarding: InstanceAiOnboardingService, pendingAgentService: InstanceAiPendingAgentService, settingsService: InstanceAiSettingsService, modelCatalogService: InstanceAiModelCatalogService, evalExecutionService: EvalExecutionService, evalAgentExecutionService: EvalAgentExecutionService, evalCredentialAllowlists: EvalThreadCredentialAllowlistService, evalThreadRestore: EvalThreadRestoreService, eventBus: InProcessEventBus, eventLog: DurableEventLog, durableLogMetrics: DurableLogMetrics, moduleRegistry: ModuleRegistry, push: Push, urlService: UrlService, userRepository: UserRepository, credentialsService: CredentialsService, projectService: ProjectService, instanceAiErrorReporter: InstanceAiErrorReporterService, publisher: Publisher, preferenceCardService: InstanceAiPreferenceCardService, globalConfig: GlobalConfig, threadTabsService: InstanceAiThreadTabsService);
    private requireInstanceAiEnabled;
    private requireModelConfigured;
    private requireRunDebugEnabled;
    stripBrotli(req: Request, _res: Response, next: NextFunction): void;
    chat(req: AuthenticatedRequest, _res: Response, threadId: string, payload: InstanceAiSendMessageRequest): Promise<{
        runId: string;
    }>;
    events(req: AuthenticatedRequest, res: FlushableResponse, threadId: string, query: InstanceAiEventsQuery): Promise<void>;
    confirm(req: AuthenticatedRequest, _res: Response, requestId: string): Promise<import("@n8n/api-types").InstanceAiConfirmResponse | {
        ok: boolean;
        runId: string;
    }>;
    cancel(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<{
        ok: boolean;
    }>;
    feedback(req: AuthenticatedRequest, _res: Response, threadId: string, responseId: string, payload: InstanceAiFeedbackRequestDto): Promise<{
        ok: boolean;
    }>;
    cancelTask(req: AuthenticatedRequest, _res: Response, threadId: string, taskId: string): Promise<{
        ok: boolean;
    }>;
    correctTask(req: AuthenticatedRequest, _res: Response, threadId: string, taskId: string, payload: InstanceAiCorrectTaskRequest): Promise<{
        ok: boolean;
    }>;
    undoPreference(req: AuthenticatedRequest, _res: Response, threadId: string, preferenceId: string, payload: InstanceAiPreferenceCardUndoRequestDto): Promise<{
        ok: boolean;
        event: {
            runId: string;
            agentId: string;
            userId?: string | undefined;
            responseId?: string | undefined;
            ts?: number | undefined;
            type: "preference-card";
            payload: {
                toolCallId: string;
                preferenceId: string;
                state: "edited" | "undone";
                content?: string | undefined;
                scope?: "instance" | "project" | "user" | undefined;
                projectId?: string | null | undefined;
            };
        };
    }>;
    editPreference(req: AuthenticatedRequest, _res: Response, threadId: string, preferenceId: string, payload: InstanceAiPreferenceCardEditRequestDto): Promise<import("@n8n/api-types").InstanceAiPreferenceCardEditResponse>;
    getCredits(req: AuthenticatedRequest): Promise<import("@n8n/api-types").InstanceAiCredits>;
    getAdminSettings(_req: AuthenticatedRequest): Promise<InstanceAiAdminSettingsResponse>;
    getModelCatalog(_req: AuthenticatedRequest): Promise<import("@n8n/api-types").InstanceAiModelCatalogResponse>;
    updateAdminSettings(req: AuthenticatedRequest, _res: Response, payload: InstanceAiAdminSettingsUpdateRequest): Promise<InstanceAiAdminSettingsResponse>;
    verifyModel(req: AuthenticatedRequest, _res: Response, payload: InstanceAiVerifyModelRequest): Promise<import("@n8n/api-types").InstanceAiVerificationResponse>;
    verifySandbox(req: AuthenticatedRequest, _res: Response, payload: InstanceAiVerifySandboxRequest): Promise<import("@n8n/api-types").InstanceAiVerificationResponse>;
    verifySearch(_req: AuthenticatedRequest, _res: Response, payload: InstanceAiVerifySearchRequest): Promise<import("@n8n/api-types").InstanceAiVerificationResponse>;
    reloadAdminSettings(): Promise<void>;
    private applyAdminSettingsSideEffects;
    getUserPreferences(req: AuthenticatedRequest): Promise<import("@n8n/api-types").InstanceAiUserPreferencesResponse>;
    updateUserPreferences(req: AuthenticatedRequest, _res: Response, payload: InstanceAiUserPreferencesUpdateRequest): Promise<import("@n8n/api-types").InstanceAiUserPreferencesResponse>;
    listServiceCredentials(_req: AuthenticatedRequest): Promise<import("@n8n/api-types").InstanceAiProviderConnection[]>;
    listInstanceModelCredentials(_req: AuthenticatedRequest): Promise<import("@n8n/api-types").InstanceAiProviderConnection[]>;
    listThreads(req: AuthenticatedRequest): Promise<import("@n8n/api-types").InstanceAiThreadListResponse>;
    listThreadHistory(req: AuthenticatedRequest, _res: Response, query: InstanceAiThreadHistoryQuery): Promise<import("@n8n/api-types").InstanceAiThreadHistoryResponse>;
    getThread(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<{
        thread: import("@n8n/api-types").InstanceAiThreadInfo;
    }>;
    ensureThread(req: AuthenticatedRequest, _res: Response, payload: InstanceAiEnsureThreadRequest): Promise<import("@n8n/api-types").InstanceAiEnsureThreadResponse>;
    deleteThread(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<{
        ok: boolean;
    }>;
    renameThread(req: AuthenticatedRequest, _res: Response, threadId: string, payload: InstanceAiRenameThreadRequestDto): Promise<{
        thread: import("@n8n/api-types").InstanceAiThreadInfo;
    }>;
    getThreadTabs(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<InstanceAiThreadTabsResponse>;
    saveThreadTabs(req: AuthenticatedRequest, _res: Response, threadId: string, payload: InstanceAiThreadTabsRequestDto): Promise<InstanceAiThreadTabsResponse>;
    persistPendingAgent(req: AuthenticatedRequest, _res: Response, threadId: string, payload: InstanceAiPersistPendingAgentRequest): Promise<{
        agent: import("../agents/entities/agent.entity").Agent & {
            isRunnable: boolean;
            hasPublishHistory: boolean;
            configHash: string | null;
            skills: Record<string, import("@n8n/api-types").AgentSkill>;
            skillHashes: Record<string, string>;
            outdatedSkillIds: string[];
        };
        thread: import("@n8n/api-types").InstanceAiThreadInfo;
    }>;
    getThreadMessages(req: AuthenticatedRequest, _res: Response, threadId: string, query: InstanceAiThreadMessagesQuery): Promise<import("@n8n/api-types").InstanceAiThreadMessagesResponse | {
        threadId: string;
        projectId?: string;
        messages: import("@n8n/api-types").InstanceAiMessage[];
        appliedPreferences?: import("@n8n/api-types").AiPreferencesAppliedPayload;
        nextEventId: number;
    }>;
    getThreadStatus(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<import("@n8n/api-types").InstanceAiThreadStatusResponse>;
    getRunDebug(req: AuthenticatedRequest, _res: Response, runId: string): Promise<import("@n8n/instance-ai").RunDebugRecord>;
    listThreadDebugRuns(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<{
        threadId: string;
        runs: {
            runId: string;
            threadId: string;
            startedAt: number;
            stepCount: number;
            workflowCodeCount: number;
            label: string | undefined;
        }[];
    }>;
    executeWithLlmMock(req: AuthenticatedRequest, _res: Response, workflowId: string, payload: InstanceAiEvalExecutionRequest): Promise<{
        executionId: string;
        success: boolean;
        nodeResults: Record<string, import("@n8n/api-types").InstanceAiEvalNodeResult>;
        errors: string[];
        hints: import("@n8n/api-types").InstanceAiEvalMockHints;
        mockedCredentials: import("@n8n/api-types").InstanceAiEvalMockedCredential[];
        rewrittenCredentials?: import("@n8n/api-types").InstanceAiEvalRewrittenCredential[];
        llmUsage: import("@n8n/api-types").InstanceAiEvalLlmUsage[];
    }>;
    executeAgentWithLlmMock(req: AuthenticatedRequest, _res: Response, agentId: string, payload: InstanceAiEvalAgentExecutionRequest): Promise<{
        runId: string;
        success: boolean;
        errors: string[];
        finalText: string;
        model?: string;
        finishReason?: string;
        toolCalls: import("@n8n/api-types").InstanceAiEvalAgentToolCallRecord[];
        modelTurns: import("@n8n/api-types").InstanceAiEvalAgentModelTurnRecord[];
        usage?: {
            inputTokens?: number;
            outputTokens?: number;
        };
        seed: import("@n8n/api-types").InstanceAiEvalAgentScenarioSeed;
        skippedFeatures: import("@n8n/api-types").InstanceAiEvalAgentSkippedFeature[];
        mockedCredentials: import("@n8n/api-types").InstanceAiEvalMockedCredential[];
        llmUsage: import("@n8n/api-types").InstanceAiEvalLlmUsage[];
    }>;
    setThreadCredentialAllowlist(req: AuthenticatedRequest, _res: Response, payload: InstanceAiEvalCredentialAllowlistRequest): Promise<{
        ok: boolean;
    }>;
    setThreadCredentialTestTarget(req: AuthenticatedRequest, _res: Response, payload: InstanceAiEvalCredentialTestTargetRequest): Promise<{
        ok: boolean;
    }>;
    getEvalThreadMemory(req: AuthenticatedRequest, _res: Response, threadId: string): Promise<InstanceAiEvalThreadMemoryResponse>;
    restoreEvalThread(req: AuthenticatedRequest, _res: Response, payload: InstanceAiEvalRestoreThreadRequest): Promise<{
        ok: boolean;
        threadId: string;
        restored: number;
        workflowIds: string[];
        dataTableIds: string[];
        agentIds: string[];
        folderIds: string[];
    }>;
    seedEvalDataTableRows(req: AuthenticatedRequest, _res: Response, payload: InstanceAiEvalSeedDataTableRowsRequest): Promise<{
        ok: boolean;
        tableId: string;
        rowCount: number;
    }>;
    createGatewayLink(req: AuthenticatedRequest): Promise<{
        token: string;
        command: string;
        expiresAt: string | null;
        ttlSeconds: number | null;
    }>;
    gatewayEvents(req: Request, res: FlushableResponse): Promise<void>;
    gatewayInit(req: Request, _res: Response, payload: InstanceAiGatewayCapabilitiesDto): Promise<{
        ok: boolean;
        sessionKey: string;
    } | {
        sessionKey?: undefined;
        ok: boolean;
    }>;
    gatewayDisconnect(req: Request): {
        ok: boolean;
    };
    gatewayResponse(req: Request, _res: Response, requestId: string, payload: InstanceAiFilesystemResponseDto): {
        ok: boolean;
    };
    gatewayCreateCredential(req: Request, _res: Response, payload: InstanceAiGatewayCreateCredentialDto): Promise<{
        credentialId: string;
    }>;
    gatewayStatus(req: AuthenticatedRequest): Promise<{
        connected: boolean;
        connectedAt: string | null;
        directory: string | null;
        hostIdentifier: string | null;
        toolCategories: import("@n8n/api-types").ToolCategory[];
    }>;
    gatewayDisconnectSession(req: AuthenticatedRequest): Promise<{
        ok: boolean;
    }>;
    createBrowserLink(req: AuthenticatedRequest): Promise<import("@n8n/api-types").InstanceAiBrowserCreateLinkResponse>;
    browserStatus(req: AuthenticatedRequest): import("@n8n/api-types").InstanceAiBrowserStatusResponse;
    browserDisconnectSession(req: AuthenticatedRequest): Promise<{
        ok: boolean;
    }>;
    private assertBrowserChannelEnabled;
    private assertThreadAccess;
    private assertGatewayEnabled;
    private getGatewayKeyHeader;
    private validateGatewayApiKey;
    private resolveGatewayUser;
    private writeSseEvent;
}
export {};
