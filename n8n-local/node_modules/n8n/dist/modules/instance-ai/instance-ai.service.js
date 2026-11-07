"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InstanceAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiService = exports.QuotaExhaustedStreamError = exports.QUOTA_EXHAUSTED_USER_MESSAGE = void 0;
exports.isAttachmentRejectedByProviderError = isAttachmentRejectedByProviderError;
exports.getUserFacingErrorMessage = getUserFacingErrorMessage;
exports.isMaskedStreamFailure = isMaskedStreamFailure;
exports.isAssistantCreditBalanceExhausted = isAssistantCreditBalanceExhausted;
exports.resolveOperatorPromptVersion = resolveOperatorPromptVersion;
const agents_1 = require("@n8n/agents");
const sandbox_1 = require("@n8n/agents/sandbox");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const confirmation_payload_1 = require("@n8n/instance-ai/confirmation-payload");
const telemetry_1 = require("@n8n/telemetry");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const is_record_1 = require("@n8n/utils/is-record");
const lazy_import_1 = require("@n8n/utils/lazy-import");
const workflow_sdk_1 = require("@n8n/workflow-sdk");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const constants_1 = require("../../constants");
const errors_1 = require("@n8n/errors");
const instance_ai_builder_delegate_adapter_1 = require("../../modules/agents/instance-ai-builder-delegate.adapter");
const instance_ai_agent_context_adapter_1 = require("../../modules/agents/instance-ai-agent-context.adapter");
const model_stream_stall_options_1 = require("../../modules/agents/model-stream-stall-options");
const check_access_1 = require("../../permissions.ee/check-access");
const push_1 = require("../../push");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const ai_preference_service_1 = require("../../services/ai-preference.service");
const ai_usage_service_1 = require("../../services/ai-usage.service");
const ai_service_1 = require("../../services/ai.service");
const proxy_token_manager_1 = require("../../services/proxy-token-manager");
const telemetry_2 = require("../../telemetry");
const utils_1 = require("../../utils");
const agent_preview_handoff_1 = require("./agent-preview-handoff");
const agents_access_1 = require("./agents-access");
const instance_context_service_1 = require("./instance-context.service");
const composite_local_mcp_server_1 = require("./browser/composite-local-mcp-server");
const instance_ai_browser_session_service_1 = require("./browser/instance-ai-browser-session.service");
const computer_use_availability_1 = require("./computer-use-availability");
const drop_rejected_attachments_1 = require("./drop-rejected-attachments");
const thread_credential_allowlist_service_1 = require("./eval/thread-credential-allowlist.service");
const durable_event_log_1 = require("./event-bus/durable-event-log");
const in_process_event_bus_1 = require("./event-bus/in-process-event-bus");
const interrupted_run_sweeper_1 = require("./event-bus/interrupted-run-sweeper");
const instance_ai_conversation_history_service_1 = require("./instance-ai-conversation-history.service");
const instance_ai_credit_service_1 = require("./instance-ai-credit.service");
const instance_ai_error_reporter_service_1 = require("./instance-ai-error-reporter.service");
const instance_ai_gateway_service_1 = require("./instance-ai-gateway.service");
const instance_ai_memory_service_1 = require("./instance-ai-memory.service");
const instance_ai_model_service_1 = require("./instance-ai-model.service");
const instance_ai_run_limit_error_1 = require("./instance-ai-run-limit.error");
const instance_ai_run_probe_1 = require("./instance-ai-run-probe");
const instance_ai_settings_service_1 = require("./instance-ai-settings.service");
const instance_ai_skills_service_1 = require("./instance-ai-skills.service");
const instance_ai_temporary_workflow_service_1 = require("./instance-ai-temporary-workflow.service");
const instance_ai_terminal_outcome_service_1 = require("./instance-ai-terminal-outcome.service");
const instance_ai_thread_tabs_service_1 = require("./instance-ai-thread-tabs.service");
const instance_ai_adapter_service_1 = require("./instance-ai.adapter.service");
const internal_messages_1 = require("./internal-messages");
const onboarding_opening_1 = require("./onboarding-opening");
const liveness_1 = require("./liveness");
const mcp_1 = require("./mcp");
const observability_1 = require("./observability");
const planned_task_action_runner_1 = require("./planned-task-action-runner");
const instance_ai_event_log_repository_1 = require("./repositories/instance-ai-event-log.repository");
const instance_ai_observation_cursor_repository_1 = require("./repositories/instance-ai-observation-cursor.repository");
const instance_ai_observation_repository_1 = require("./repositories/instance-ai-observation.repository");
const instance_ai_pending_confirmation_repository_1 = require("./repositories/instance-ai-pending-confirmation.repository");
const instance_ai_thread_grant_repository_1 = require("./repositories/instance-ai-thread-grant.repository");
const sandbox_2 = require("./sandbox");
const db_iteration_log_storage_1 = require("./storage/db-iteration-log-storage");
const typeorm_agent_checkpoint_store_1 = require("./storage/typeorm-agent-checkpoint-store");
const typeorm_agent_memory_1 = require("./storage/typeorm-agent-memory");
const stream_transport_error_1 = require("./stream-transport-error");
const suspended_run_restorer_service_1 = require("./suspended-run-restorer.service");
const suspended_thread_persistence_service_1 = require("./suspended-thread-persistence.service");
const tracing_1 = require("./tracing");
const workflow_verification_obligation_service_1 = require("./workflow-verification-obligation-service");
const workflow_verification_task_projector_1 = require("./workflow-verification-task-projector");
const agent_execution_service_1 = require("../agents/agent-execution.service");
const format_preview_context_1 = require("../agents/builder/format-preview-context");
function buildSuspensionTraceOutputs(runId, suspension) {
    const rawMessage = suspension?.suspendPayload.message;
    const message = typeof rawMessage === 'string' && rawMessage ? rawMessage : undefined;
    return {
        status: 'suspended',
        runId,
        ...(suspension?.requestId ? { requestId: suspension.requestId } : {}),
        ...(suspension?.toolCallId ? { pendingToolCallId: suspension.toolCallId } : {}),
        ...(suspension?.toolName ? { toolName: suspension.toolName } : {}),
        ...(message ? { message } : {}),
    };
}
function isNamedResourceAttachment(attachment) {
    return attachment.type !== 'nodes' && Boolean(attachment.name);
}
function buildHandoffContextBlock(context) {
    if (!context || context.source !== 'credential-modal')
        return '';
    const { credential } = context;
    const placeholderTitles = credential.placeholderTitles ?? [];
    const lines = [
        `- Credential type: \`${credential.credentialType}\` (${credential.displayName}).`,
        credential.id ? `- Existing credential id: \`${credential.id}\`.` : '',
        credential.nodeName ? `- Node name: "${credential.nodeName}".` : '',
        credential.nodeType ? `- Node type: \`${credential.nodeType}\`.` : '',
        placeholderTitles.length
            ? `- The credential form is fully pre-filled from a recipe; the user only pastes: ${placeholderTitles.map((title) => `"${title}"`).join(', ')}.`
            : '',
        credential.docsUrl
            ? `- The provider page where the user creates/copies the secret (verified during recipe research): ${credential.docsUrl}`
            : '',
        credential.documentationUrl ? `- n8n documentation URL: ${credential.documentationUrl}` : '',
        credential.oauthRedirectUrl
            ? `- OAuth redirect/callback URL shown in the modal: ${credential.oauthRedirectUrl}`
            : '',
    ].filter(Boolean);
    const prose = [
        'The user opened this conversation from the credential setup modal and is asking for setup guidance.',
        ...lines,
        'Use this metadata only as setup context. Never ask the user to paste credential secrets into chat. For credential setup docs, load `n8n-docs-assistant` and use `n8n-docs` with `intent: "credential-setup"`.',
        placeholderTitles.length
            ? `Because the form is pre-filled, give step-by-step guidance on where to obtain the listed value(s) on the provider side${credential.docsUrl ? ' — direct the user to the provider page above rather than re-researching' : ' (research the provider if needed)'} — and do NOT suggest editing the auth template, test URL, or any other credential field.`
            : '',
    ]
        .filter(Boolean)
        .join('\n');
    return `${internal_messages_1.CREDENTIAL_CONTEXT_OPEN_TAG}\n${JSON.stringify(context)}\n\n${prose}\n${internal_messages_1.CREDENTIAL_CONTEXT_CLOSE_TAG}`;
}
function isTelemetryConfigurableAgent(agent) {
    return (typeof agent === 'object' &&
        agent !== null &&
        typeof Reflect.get(agent, 'telemetry') === 'function');
}
const WORKFLOW_SETUP_ROUTING_CLAIM_TTL_MS = 15 * 60 * 1000;
const CONFIRMATION_EXPIRED_MESSAGE = 'This confirmation has expired. Send a new message to continue.';
const RESUME_REJECTED_MESSAGE = 'I could not apply that confirmation. Send a new message to continue.';
const INSTANCE_AI_SHUTDOWN_DRAIN_TIMEOUT_MS = 5 * 1000;
function isTextMessagePart(part) {
    return (typeof part === 'object' &&
        part !== null &&
        'type' in part &&
        part.type === 'text' &&
        'text' in part &&
        typeof part.text === 'string');
}
function isSandboxEndpointNotAllowedError(error) {
    return (0, get_error_message_1.getErrorMessage)(error).toLowerCase().includes('endpoint not allowed');
}
function isStaleResumeError(error) {
    return error instanceof Error && error.name === 'StaleResumeError';
}
const ATTACHMENT_SUBJECT_PATTERN = /image|attachment/;
const ATTACHMENT_REFUSAL_PATTERN = /exceed|too large|maximum|max allowed|could not process/;
function collectErrorText(value, depth = 0) {
    if (depth > 4 || value === null || value === undefined)
        return [];
    if (typeof value === 'string')
        return [value];
    if (Array.isArray(value))
        return value.flatMap((item) => collectErrorText(item, depth + 1));
    if (value instanceof Error) {
        return [value.message, ...collectErrorText(Reflect.get(value, 'cause'), depth + 1)];
    }
    if (typeof value === 'object') {
        const record = value;
        return ['message', 'error', 'responseBody', 'data', 'cause', 'errors'].flatMap((key) => collectErrorText(record[key], depth + 1));
    }
    return [];
}
function isAttachmentRejectedByProviderError(error) {
    const haystack = [(0, get_error_message_1.getErrorMessage)(error), ...collectErrorText(error)].join(' ').toLowerCase();
    return ATTACHMENT_SUBJECT_PATTERN.test(haystack) && ATTACHMENT_REFUSAL_PATTERN.test(haystack);
}
exports.QUOTA_EXHAUSTED_USER_MESSAGE = "You've run out of AI credits. Upgrade your plan to continue using the n8n Assistant.";
const OPERATIONAL_ERROR_USER_MESSAGE = 'I hit an operational error before I could finish that response. Please try again.';
const GENERIC_ERROR_USER_MESSAGE = 'Something went wrong before I could finish that response. Please try again.';
function getUserFacingErrorCode(error) {
    return (0, instance_ai_1.isQuotaExhaustedError)(error) ? 'quota_exhausted' : undefined;
}
function getUserFacingErrorMessage(error, fallback = GENERIC_ERROR_USER_MESSAGE, opts = {}) {
    if ((0, instance_ai_1.isQuotaExhaustedError)(error)) {
        return exports.QUOTA_EXHAUSTED_USER_MESSAGE;
    }
    if ((0, stream_transport_error_1.isStreamTransportError)(error)) {
        return 'The connection to the AI provider dropped before I could finish that response. Please try again.';
    }
    if (error instanceof n8n_workflow_1.UserError) {
        return error.message;
    }
    if (isStaleResumeError(error)) {
        return "This approval was already handled. If the assistant isn't responding, send a new message to continue.";
    }
    if (isSandboxEndpointNotAllowedError(error)) {
        return "I couldn't finish preparing the workspace sandbox. Please try again in a moment.";
    }
    if (opts.attachmentRemoved !== undefined || isAttachmentRejectedByProviderError(error)) {
        const sizeAdvice = isAttachmentRejectedByProviderError(error)
            ? ` Keep it under ${(0, api_types_1.formatAttachmentSizeLimit)()}, and for images no more than 8000x8000 pixels.`
            : '';
        return opts.attachmentRemoved === false
            ? 'I could not read one of the attached files, and I could not remove it from this ' +
                `conversation either. Start a new chat and attach it again.${sizeAdvice}`
            : 'I could not read one of the attached files, so I left it out. Attach it again — ' +
                `ideally a smaller version.${sizeAdvice}`;
    }
    if (error instanceof n8n_workflow_1.OperationalError) {
        return OPERATIONAL_ERROR_USER_MESSAGE;
    }
    return fallback;
}
function isMaskedStreamFailure(error) {
    if (!(error instanceof Error))
        return false;
    if (error.name === 'AI_NoOutputGeneratedError')
        return true;
    return error.name === 'TypeError' && error.message === 'terminated';
}
const GENERATION_STAGE_ERROR_CODES = new Set([
    'missing_captured_fields',
    'unresolved_field',
    'gateway_context_missing',
]);
function failureStageForErrorCode(errorCode) {
    if (errorCode && GENERATION_STAGE_ERROR_CODES.has(errorCode))
        return 'generation';
    if (errorCode === 'credential_create_failed')
        return 'persistence';
    return 'unknown';
}
class QuotaExhaustedStreamError extends n8n_workflow_1.UserError {
    constructor(maskedError) {
        super(`AI credits exhausted (${maskedError.name}: ${maskedError.message})`, {
            cause: maskedError,
        });
        this.errorCode = 'quota_exhausted';
    }
}
exports.QuotaExhaustedStreamError = QuotaExhaustedStreamError;
function createInertAbortSignal() {
    return new AbortController().signal;
}
function isAssistantCreditBalanceExhausted(credits) {
    return credits.creditsQuota >= 0 && credits.creditsClaimed >= credits.creditsQuota;
}
function assistantCreditsExhaustedError() {
    return new QuotaExhaustedStreamError(new Error('Assistant credits exhausted'));
}
function asQuotaExhaustedError(error) {
    if (error instanceof QuotaExhaustedStreamError)
        return error;
    if (!(0, instance_ai_1.isQuotaExhaustedError)(error))
        return undefined;
    if (error instanceof Error)
        return new QuotaExhaustedStreamError(error);
    return assistantCreditsExhaustedError();
}
function quotaExhaustedFromSignal(signal) {
    if (!('reason' in signal))
        return undefined;
    return asQuotaExhaustedError(signal.reason);
}
function getAbortReason(signal) {
    const reason = signal.reason;
    if (typeof reason === 'object' &&
        reason !== null &&
        'name' in reason &&
        reason.name === 'AbortError') {
        return 'user_cancelled';
    }
    if (reason instanceof Error)
        return reason.message;
    return typeof reason === 'string' ? reason : 'user_cancelled';
}
function classifyUnclaimedResume(error, flags) {
    if (isStaleResumeError(error))
        return { kind: 'stale' };
    if ((0, instance_ai_1.isQuotaExhaustedError)(error)) {
        return {
            kind: 'errored',
            reason: getUserFacingErrorMessage(error),
            errorCode: getUserFacingErrorCode(error),
            errorMessage: (0, get_error_message_1.getErrorMessage)(error),
        };
    }
    if (flags.aborted)
        return flags.preserveHitl ? { kind: 'preserve-hitl' } : { kind: 'cancelled' };
    return {
        kind: 'errored',
        reason: getUserFacingErrorMessage(error, RESUME_REJECTED_MESSAGE),
        errorCode: getUserFacingErrorCode(error),
        errorMessage: (0, get_error_message_1.getErrorMessage)(error),
    };
}
const MAX_CONCURRENT_BACKGROUND_TASKS_PER_THREAD = 5;
const UNLIMITED_CONCURRENCY = -1;
const MAX_CONSECUTIVE_FAILED_INTERNAL_FOLLOW_UPS = 3;
const TITLE_REFINE_HISTORY_LIMIT = 50;
function resolveOperatorPromptVersion(configured) {
    const version = configured?.trim();
    if (!version)
        return undefined;
    (0, instance_ai_1.assertInstanceAiPromptVersion)(version);
    return version;
}
let InstanceAiService = InstanceAiService_1 = class InstanceAiService {
    get mcpClientManager() {
        if (!this._mcpClientManager) {
            this._mcpClientManager = new instance_ai_1.McpClientManager(this._ssrfProtectionConfig.enabled ? this._ssrfProtectionService : undefined, { onToolCallSettled: (event) => this.trackMcpToolCall(event) });
        }
        return this._mcpClientManager;
    }
    constructor(logger, globalConfig, instanceSettings, adapterService, eventBus, eventLog, interruptedRunSweeper, settingsService, gatewayService, browserSessionService, memoryService, agentMemory, checkpointStore, aiService, threadGrantRepo, pendingConfirmationRepo, observationRepo, observationCursorRepo, urlService, eventLogRepository, dbIterationLogStorage, instanceWriteAccess, telemetry, mcpRegistryService, userRepository, temporaryWorkflowService, errorReporter, ssrfProtectionConfig, ssrfProtectionService, eventService, evalCredentialAllowlists, runProbe, modelService, creditService, publisher, instanceAiErrorReporter, push, conversationHistoryService, instanceContext, aiPreferenceService, aiUsageService, threadTabsService, skillsService) {
        this.instanceSettings = instanceSettings;
        this.adapterService = adapterService;
        this.eventBus = eventBus;
        this.eventLog = eventLog;
        this.interruptedRunSweeper = interruptedRunSweeper;
        this.settingsService = settingsService;
        this.gatewayService = gatewayService;
        this.browserSessionService = browserSessionService;
        this.memoryService = memoryService;
        this.agentMemory = agentMemory;
        this.checkpointStore = checkpointStore;
        this.aiService = aiService;
        this.threadGrantRepo = threadGrantRepo;
        this.pendingConfirmationRepo = pendingConfirmationRepo;
        this.observationRepo = observationRepo;
        this.observationCursorRepo = observationCursorRepo;
        this.urlService = urlService;
        this.eventLogRepository = eventLogRepository;
        this.dbIterationLogStorage = dbIterationLogStorage;
        this.instanceWriteAccess = instanceWriteAccess;
        this.telemetry = telemetry;
        this.mcpRegistryService = mcpRegistryService;
        this.userRepository = userRepository;
        this.temporaryWorkflowService = temporaryWorkflowService;
        this.errorReporter = errorReporter;
        this.eventService = eventService;
        this.evalCredentialAllowlists = evalCredentialAllowlists;
        this.modelService = modelService;
        this.creditService = creditService;
        this.publisher = publisher;
        this.instanceAiErrorReporter = instanceAiErrorReporter;
        this.push = push;
        this.conversationHistoryService = conversationHistoryService;
        this.instanceContext = instanceContext;
        this.aiPreferenceService = aiPreferenceService;
        this.aiUsageService = aiUsageService;
        this.threadTabsService = threadTabsService;
        this.skillsService = skillsService;
        this.runState = new instance_ai_1.RunStateRegistry((user) => user.id);
        this.memoryTaskRegistry = new instance_ai_1.MemoryTaskRegistry();
        this.domainAccessTrackersByThread = new Map();
        this.threadPushRef = new Map();
        this.pendingBrowserCredentialSetups = new Map();
        this.planRequestsByThread = new Map();
        this.schedulerLocks = new Map();
        this.failedInternalFollowUpStreaks = new Map();
        this.runDebugBuffer = new instance_ai_1.RunDebugBuffer();
        this.inFlightExecutions = new Set();
        this.preserveHitlOnShutdown = new Set();
        this.logger = logger.scoped('instance-ai');
        runProbe.registerActiveRunCountProvider(() => this.runState.activeRunCount());
        this.workflowObligations = new workflow_verification_obligation_service_1.WorkflowVerificationObligationService(this.agentMemory, (threadId) => this.runState.isSetupPanelEnabled(threadId));
        this.taskProjector = new workflow_verification_task_projector_1.WorkflowVerificationTaskProjector(this.agentMemory, this.eventBus, this.logger, this.workflowObligations);
        this.instanceAiConfig = globalConfig.instanceAi;
        this.aiConfig = globalConfig.ai;
        this.backgroundTasks = new instance_ai_1.BackgroundTaskManager(MAX_CONCURRENT_BACKGROUND_TASKS_PER_THREAD, this.instanceAiConfig.maxConcurrentSubAgents);
        this.creditService.onQuotaExhausted((exhaustedUser) => {
            this.stopRunsForQuotaExhaustion(exhaustedUser);
        });
        this.suspendedThreads = new suspended_thread_persistence_service_1.SuspendedThreadPersistenceService({
            logger: this.logger,
            config: this.instanceAiConfig,
            pendingConfirmationRepo: this.pendingConfirmationRepo,
        });
        this.suspendedRunRestorer = new suspended_run_restorer_service_1.SuspendedRunRestorer({
            logger: this.logger,
            pendingConfirmationRepo: this.pendingConfirmationRepo,
            runState: this.runState,
            eventBus: this.eventBus,
            rebuilder: {
                rebuildSuspendedRun: this.rebuildSuspendedRunFromCheckpoint.bind(this),
                resumeSuspendedRun: this.resumeSuspendedRun.bind(this),
            },
        });
        const livenessPolicyConfig = (0, instance_ai_1.createInstanceAiLivenessPolicyConfig)({
            confirmationTimeoutMs: this.instanceAiConfig.confirmationTimeout,
        });
        this.liveness = new liveness_1.InstanceAiLivenessService({
            policy: new instance_ai_1.InstanceAiLivenessPolicy(livenessPolicyConfig),
            backgroundTaskIdleTimeoutMs: livenessPolicyConfig.backgroundTaskIdleTimeoutMs,
            runState: this.runState,
            backgroundTasks: this.backgroundTasks,
            eventBus: this.eventBus,
            logger: this.logger,
            finalizeCancelledSuspendedRun: (suspended, reason) => {
                void this.finalizeCancelledSuspendedRun(suspended, reason);
            },
            onPendingConfirmationRejected: (requestId) => {
                void this.suspendedThreads.dropPendingConfirmation(requestId);
            },
        });
        this.tracing = new tracing_1.InstanceAiTracingService({
            logger: this.logger,
            eventReader: {
                getEventsForRun: async (threadId, runId) => await this.readRunEvents(threadId, [runId]),
            },
            runState: this.runState,
            eventLog: this.eventLogRepository,
            aiService: this.aiService,
        });
        this.sandboxService = new sandbox_2.InstanceAiSandboxService({
            config: this.instanceAiConfig,
            logger: this.logger,
            errorReporter: this.errorReporter,
            runState: this.runState,
            backgroundTasks: this.backgroundTasks,
            settingsService: this.settingsService,
            aiService: this.aiService,
            resolveTracingConfig: async (threadId, userId) => {
                const ownerId = userId ?? (await this.agentMemory.getThread(threadId))?.resourceId;
                if (!ownerId)
                    return { userId: 'system' };
                const { tracingProxyConfig } = await this.createProxyRunConfig({ id: ownerId });
                return { userId: ownerId, proxyConfig: tracingProxyConfig };
            },
        });
        this.terminalOutcome = new instance_ai_terminal_outcome_service_1.InstanceAiTerminalOutcomeService({
            eventBus: {
                publish: (threadId, event) => this.eventBus.publish(threadId, event),
                getEventsForRun: async (threadId, runId) => await this.readRunEvents(threadId, [runId]),
                getEventsForRuns: async (threadId, runIds) => await this.readRunEvents(threadId, runIds),
            },
            agentMemory: this.agentMemory,
            telemetry: this.telemetry,
            errorReporter: this.instanceAiErrorReporter,
            logger: this.logger,
            runState: this.runState,
            suspendedThreads: this.suspendedThreads,
            tracing: this.tracing,
            publishRunFinish: (threadId, runId, status, reason, promptVersion) => {
                this.publishRunFinish(threadId, runId, status, reason, undefined, undefined, {
                    promptVersion,
                });
            },
        });
        this.defaultTimeZone = globalConfig.generic.timezone;
        const restEndpoint = globalConfig.endpoints.rest;
        this.oauth2CallbackUrl = `${this.urlService.getInstanceBaseUrl()}/${restEndpoint}/oauth2-credential/callback`;
        this.webhookBaseUrl = `${this.urlService.getWebhookBaseUrl()}${globalConfig.endpoints.webhook}`;
        this.formBaseUrl = `${this.urlService.getWebhookBaseUrl()}${globalConfig.endpoints.form}`;
        this._ssrfProtectionConfig = ssrfProtectionConfig;
        this._ssrfProtectionService = ssrfProtectionService;
        this.eventService.on('instance-ai-settings-updated', ({ mcpSettingsChanged }) => {
            this.sandboxService.invalidateCachedWorkspaces();
            if (!mcpSettingsChanged)
                return;
            if (!this._mcpClientManager)
                return;
            this._mcpClientManager.disconnect().catch((error) => {
                this.logger.warn('Failed to disconnect MCP clients after settings change', {
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
            });
        });
        this.liveness.start();
    }
    async createProxyRunConfig(user) {
        if (!this.aiService.isProxyEnabled())
            return {};
        const client = await this.aiService.getClient();
        const proxyBaseUrl = client.getApiProxyBaseUrl();
        const tokenManager = new proxy_token_manager_1.ProxyTokenManager(async () => {
            return await client.getInstanceAiApiProxyToken({ id: user.id }, { userMessageId: (0, nanoid_1.nanoid)() });
        });
        const featureHeaders = (0, api_types_1.buildProxyHeaders)({
            feature: 'instance-ai',
            n8nVersion: constants_1.N8N_VERSION,
        });
        return {
            proxyBaseUrl,
            tokenManager,
            searchProxyConfig: {
                apiUrl: proxyBaseUrl + '/brave-search',
                getAuthHeaders: async () => ({
                    ...(await tokenManager.getAuthHeaders()),
                    ...featureHeaders,
                }),
            },
            tracingProxyConfig: {
                apiUrl: proxyBaseUrl + '/langsmith',
                getAuthHeaders: async () => ({
                    ...(await tokenManager.getAuthHeaders()),
                    ...featureHeaders,
                }),
            },
        };
    }
    async resolveAgentModelConfig(user) {
        return await this.modelService.resolveAgentModelConfig(user);
    }
    async loadThreadSessionGrants(threadId, userId) {
        try {
            return await this.threadGrantRepo.findKeys(threadId, userId);
        }
        catch (error) {
            this.logger.warn('Failed to load Instance AI session grants', {
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return new Set();
        }
    }
    async persistThreadSessionGrant(threadId, userId, key) {
        try {
            await this.threadGrantRepo.grant(threadId, userId, key);
        }
        catch (error) {
            this.logger.warn('Failed to persist Instance AI session grant', {
                threadId,
                key,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    async revokeThreadSessionGrant(threadId, userId, key) {
        try {
            await this.threadGrantRepo.revoke(threadId, userId, key);
        }
        catch (error) {
            this.logger.warn('Failed to revoke Instance AI session grant', {
                threadId,
                key,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    isProxyEnabled() {
        return this.modelService.isProxyEnabled();
    }
    async getCredits(user) {
        return await this.modelService.getCredits(user);
    }
    async dropTurnAttachments(args) {
        const outcome = await (0, drop_rejected_attachments_1.dropRejectedAttachmentsFromHistory)(this.agentMemory, { threadId: args.threadId, resourceId: args.resourceId }, this.logger);
        if (outcome === 'no-attachments')
            return undefined;
        return outcome === 'removed';
    }
    shouldDropTurnAttachments(args) {
        return args.turnHadAttachments && args.producedNoOutput;
    }
    async assertAssistantCreditsAvailable(user) {
        let credits;
        try {
            credits = await this.modelService.getCredits(user);
        }
        catch (error) {
            this.logger.debug('Skipping pre-run credit check; balance read failed', {
                userId: user.id,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return;
        }
        if (!isAssistantCreditBalanceExhausted(credits))
            return;
        throw assistantCreditsExhaustedError();
    }
    async reclassifyMaskedStreamFailure(error, user, context) {
        if (!isMaskedStreamFailure(error))
            return error;
        try {
            const { creditsQuota, creditsClaimed } = await this.modelService.getCredits(user);
            if (creditsQuota < 0 || creditsClaimed < creditsQuota)
                return error;
        }
        catch (creditsError) {
            this.logger.debug('Masked stream failure credit re-check failed; keeping original error', {
                error: (0, get_error_message_1.getErrorMessage)(creditsError),
                ...context,
            });
            return error;
        }
        this.logger.info('Reclassified masked stream failure as quota-exhausted', {
            maskedError: (0, get_error_message_1.getErrorMessage)(error),
            ...context,
        });
        return new QuotaExhaustedStreamError(error);
    }
    isEnabled() {
        return this.settingsService.isAgentEnabled() && !!this.instanceAiConfig.model;
    }
    hasActiveRun(threadId) {
        return this.runState.hasLiveRun(threadId);
    }
    isRunLive(threadId, runId) {
        return (this.runState.getActiveRunId(threadId) === runId ||
            this.runState.getSuspendedRun(threadId)?.runId === runId);
    }
    getThreadStatus(threadId) {
        const status = this.runState.getThreadStatus(threadId, this.backgroundTasks.getTaskSnapshots(threadId));
        const memoryTasks = this.memoryTaskRegistry.getTasks(threadId);
        const selectedPrompt = this.runState.getPromptConfiguration(threadId);
        return {
            ...status,
            memoryTasks,
            ...(selectedPrompt ? { promptConfiguration: selectedPrompt } : {}),
        };
    }
    memoryTaskObserverFor(threadId, tracing) {
        return (event) => {
            tracing?.onMemoryTaskEvent?.(event);
            this.memoryTaskRegistry.handleEvent(threadId, event);
            const pendingTasks = this.memoryTaskRegistry.getTasks(threadId);
            const logContext = {
                threadId,
                taskId: event.task.id,
                taskKind: event.task.taskKind,
                pendingCount: pendingTasks.length,
                ...(event.type === 'skipped' ? { reason: event.reason } : {}),
                ...(event.type === 'failed' ? { error: (0, get_error_message_1.getErrorMessage)(event.error) } : {}),
                ...(event.type === 'completed' &&
                    event.value &&
                    typeof event.value === 'object' &&
                    'status' in event.value &&
                    typeof event.value.status === 'string'
                    ? { outcome: event.value.status }
                    : {}),
            };
            this.logger.info(`Observational memory task ${event.type}`, logContext);
        };
    }
    subscribeToAgentErrors(agent, threadId, runId) {
        agent.on("error", (event) => {
            if (event.type !== "error")
                return;
            if (!event.source)
                return;
            const severity = (0, instance_ai_error_reporter_service_1.getAgentErrorSeverity)(event.source);
            this.instanceAiErrorReporter.report(event.error, {
                component: `instance-ai-${event.source}`,
                ...(severity ? { severity } : {}),
                threadId,
                runId,
            });
        });
    }
    isRunDebugEnabled() {
        return this.instanceAiConfig.runDebugEnabled;
    }
    buildOrchestratorAgentStreamOptions(user, threadId, runId, signal) {
        if (this.isRunDebugEnabled()) {
            this.runDebugBuffer.ensure(runId, threadId);
        }
        return {
            maxIterations: instance_ai_1.MAX_STEPS.ORCHESTRATOR,
            abortSignal: signal,
            recoverUsageOnAbort: true,
            ...(0, model_stream_stall_options_1.modelStreamStallOptions)(this.aiConfig),
            persistence: {
                resourceId: user.id,
                threadId,
                hostRunId: runId,
                hostMetadata: {
                    buildMode: this.runState.getBuildMode(threadId) ?? null,
                    promptVersion: this.runState.getPromptVersion(threadId) ?? null,
                },
            },
            providerOptions: {
                anthropic: { cacheControl: { type: 'ephemeral' } },
            },
            ...(this.isRunDebugEnabled()
                ? (0, instance_ai_1.createRunDebugStepHooks)(this.runDebugBuffer, { runId, threadId })
                : {}),
        };
    }
    buildOrchestratorResumeAgentOptions(user, threadId, runId, agentRunId, toolCallId, signal) {
        if (this.isRunDebugEnabled()) {
            this.runDebugBuffer.ensure(runId, threadId);
        }
        return {
            runId: agentRunId,
            toolCallId,
            abortSignal: signal,
            recoverUsageOnAbort: true,
            ...(0, model_stream_stall_options_1.modelStreamStallOptions)(this.aiConfig),
            persistence: {
                resourceId: user.id,
                threadId,
                hostRunId: runId,
                hostMetadata: {
                    buildMode: this.runState.getBuildMode(threadId) ?? null,
                    promptVersion: this.runState.getPromptVersion(threadId) ?? null,
                },
            },
            providerOptions: {
                anthropic: { cacheControl: { type: 'ephemeral' } },
            },
            ...(this.isRunDebugEnabled()
                ? (0, instance_ai_1.createRunDebugStepHooks)(this.runDebugBuffer, { runId, threadId })
                : {}),
        };
    }
    async getThreadMemory(userId, threadId) {
        const thread = await this.agentMemory.getThread(threadId);
        if (!thread || thread.resourceId !== userId) {
            throw new errors_1.ForbiddenError('Not authorized for this thread');
        }
        const [observations, cursor] = await Promise.all([
            this.observationRepo.findActiveForThread(threadId),
            this.observationCursorRepo.findForThread(threadId),
        ]);
        return {
            observations: observations.map(({ marker, text, tokenCount }) => ({
                marker,
                text,
                tokenCount,
            })),
            cursor: cursor && {
                lastObservedMessageId: cursor.lastObservedMessageId,
                lastObservedAt: cursor.lastObservedAt.toISOString(),
            },
        };
    }
    getRunDebug(runId) {
        return this.runDebugBuffer.get(runId);
    }
    listThreadDebugRuns(threadId) {
        return this.runDebugBuffer.listByThread(threadId).map((record) => ({
            runId: record.runId,
            threadId: record.threadId,
            startedAt: record.startedAt,
            stepCount: record.steps.length,
            workflowCodeCount: record.workflowCode.length,
            label: record.label,
        }));
    }
    clearTraceContextsForTest() {
        this.tracing.clearTraceContextsForTest();
    }
    async submitLangsmithFeedback(user, threadId, responseId, payload) {
        await this.tracing.submitLangsmithFeedback(user, threadId, responseId, payload);
    }
    assertRunAdmissible(user) {
        const { maxConcurrentRuns, maxConcurrentRunsPerUser } = this.instanceAiConfig;
        if (maxConcurrentRunsPerUser !== UNLIMITED_CONCURRENCY) {
            const running = this.runState.activeRunCountForUser(user.id);
            if (running >= maxConcurrentRunsPerUser) {
                this.logger.warn('Refused Instance AI run: per-user concurrency limit reached', {
                    userId: user.id,
                    running,
                    limit: maxConcurrentRunsPerUser,
                });
                this.eventService.emit('instance-ai-run-refused', { reason: 'user_run_limit' });
                throw new instance_ai_run_limit_error_1.InstanceAiRunLimitError(`You already have ${running} conversations running. Wait for one to finish, or stop it, before starting another.`, { reason: 'user_run_limit', limit: maxConcurrentRunsPerUser });
            }
        }
        if (maxConcurrentRuns !== UNLIMITED_CONCURRENCY) {
            const running = this.runState.activeRunCount();
            if (running >= maxConcurrentRuns) {
                this.logger.warn('Refused Instance AI run: instance concurrency limit reached', {
                    userId: user.id,
                    running,
                    limit: maxConcurrentRuns,
                });
                this.eventService.emit('instance-ai-run-refused', { reason: 'instance_run_limit' });
                throw new instance_ai_run_limit_error_1.InstanceAiRunLimitError('This n8n instance is already running the maximum number of assistant conversations. Try again in a moment.', { reason: 'instance_run_limit', limit: maxConcurrentRuns });
            }
        }
    }
    startRun(user, threadId, message, attachments, context, timeZone, pushRef, mode, promptVersion, computerUseChannels, threadArtifacts, observerThresholdTokens) {
        if (promptVersion !== undefined &&
            (0, instance_ai_1.resolvePromptProfile)({ version: promptVersion }).fallbackFrom) {
            throw new errors_1.BadRequestError(`Unknown Instance AI prompt version "${promptVersion}"`);
        }
        this.assertRunAdmissible(user);
        this.liveness.clearThreadState(threadId);
        const { runId, abortController, messageGroupId } = this.runState.startRun({
            threadId,
            user,
        });
        if (timeZone) {
            this.runState.setTimeZone(threadId, timeZone);
        }
        this.runState.setComputerUseChannels(threadId, computerUseChannels);
        this.runState.setBuildMode(threadId, mode);
        this.runState.setPromptVersion(threadId, promptVersion);
        this.runState.setObserverThresholdTokens(threadId, observerThresholdTokens);
        if (pushRef !== undefined) {
            this.threadPushRef.set(threadId, pushRef);
        }
        this.startExecuteRun(user, threadId, runId, message, abortController, attachments, context, messageGroupId, timeZone, false, undefined, undefined, undefined, threadArtifacts);
        return runId;
    }
    getMessageGroupId(threadId) {
        return this.runState.getMessageGroupId(threadId);
    }
    getLiveMessageGroupId(threadId) {
        return this.runState.getLiveMessageGroupId(threadId, this.backgroundTasks.getTaskSnapshots(threadId));
    }
    getRunIdsForMessageGroup(messageGroupId) {
        return this.runState.getRunIdsForMessageGroup(messageGroupId);
    }
    getActiveRunId(threadId) {
        return this.runState.getActiveRunId(threadId);
    }
    stopRunsForQuotaExhaustion(user) {
        const threadIds = new Set(this.runState.listLiveThreadIdsForUser(user.id));
        for (const task of this.backgroundTasks.listRunningTasks()) {
            if (this.runState.getThreadUser(task.threadId)?.id === user.id) {
                threadIds.add(task.threadId);
            }
        }
        for (const threadId of threadIds) {
            try {
                this.cancelRun(threadId, 'quota_exhausted');
            }
            catch (error) {
                this.logger.warn('Failed to stop a run after assistant credits ran out', {
                    threadId,
                    userId: user.id,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
            }
        }
    }
    cancelRun(threadId, reason = 'user_cancelled') {
        const quotaStop = reason === 'quota_exhausted';
        const abortReason = quotaStop ? assistantCreditsExhaustedError() : undefined;
        const cancelledTasks = this.backgroundTasks.cancelThread(threadId, abortReason);
        const user = this.runState.getThreadUser(threadId);
        for (const task of cancelledTasks) {
            void this.tracing.finalizeBackgroundTaskTracing(task, 'cancelled');
            if (quotaStop) {
                this.eventBus.publish(threadId, {
                    type: 'error',
                    runId: task.runId,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(task.runId),
                    payload: {
                        content: exports.QUOTA_EXHAUSTED_USER_MESSAGE,
                        code: 'quota_exhausted',
                    },
                });
            }
            this.eventBus.publish(threadId, {
                type: 'agent-completed',
                runId: task.runId,
                agentId: task.agentId,
                payload: {
                    role: task.role,
                    result: '',
                    status: quotaStop ? 'error' : 'cancelled',
                    ...(quotaStop ? { error: exports.QUOTA_EXHAUSTED_USER_MESSAGE } : {}),
                },
            });
            void this.terminalOutcome.recordBackgroundTerminalOutcome(task);
            if (user) {
                void this.handlePlannedTaskSettlement(user, task, 'cancelled', { reschedule: false });
            }
        }
        void this.cancelAwaitingApprovalPlan(threadId);
        const { active, suspended } = this.runState.cancelThread(threadId);
        if (active) {
            if (reason === liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON)
                this.liveness.markRunTimedOut(active.runId);
            active.abortController.abort(abortReason);
            void this.suspendedThreads.dropPendingConfirmationsForThread(threadId);
            return;
        }
        if (suspended) {
            if (reason === liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON)
                this.liveness.markRunTimedOut(suspended.runId);
            suspended.abortController.abort(abortReason);
            if (quotaStop && abortReason) {
                void this.emitTerminalRun({
                    threadId,
                    runId: suspended.runId,
                    status: 'errored',
                    reason: exports.QUOTA_EXHAUSTED_USER_MESSAGE,
                    errorCode: 'quota_exhausted',
                    errorInfo: {
                        errorMessage: abortReason.message,
                        errorSource: 'exception',
                    },
                    messageGroupId: suspended.messageGroupId,
                    user: suspended.user,
                    ...(suspended.modelId !== undefined ? { modelId: suspended.modelId } : {}),
                    promptVersion: suspended.orchestrationContext?.promptConfiguration?.version,
                });
            }
            else {
                void this.finalizeCancelledSuspendedRun(suspended, reason);
            }
        }
        void this.suspendedThreads.dropPendingConfirmationsForThread(threadId);
    }
    sendCorrectionToTask(threadId, taskId, correction) {
        return this.backgroundTasks.queueCorrection(threadId, taskId, correction);
    }
    cancelBackgroundTask(threadId, taskId) {
        const task = this.backgroundTasks.cancelTask(threadId, taskId);
        if (!task)
            return;
        void this.tracing.finalizeBackgroundTaskTracing(task, 'cancelled');
        this.eventBus.publish(threadId, {
            type: 'agent-completed',
            runId: task.runId,
            agentId: task.agentId,
            payload: { role: task.role, result: '', status: 'cancelled' },
        });
        void this.terminalOutcome.recordBackgroundTerminalOutcome(task);
        const user = this.runState.getThreadUser(threadId);
        if (user) {
            void this.handlePlannedTaskSettlement(user, task, 'cancelled');
        }
    }
    broadcastTaskControl(payload) {
        if (!this.instanceSettings.isMultiMain)
            return;
        void this.publisher
            .publishCommand({ command: 'relay-instance-ai-task-control', payload })
            .catch((error) => this.logger.error('Failed to relay Instance AI task-control to sibling mains', {
            threadId: payload.threadId,
            action: payload.action,
            error,
        }));
    }
    async applyTaskControlLocally({ threadId, taskId, action, correction, userId, }) {
        switch (action) {
            case 'correct':
                if (!taskId || correction === undefined)
                    return true;
                return this.sendCorrectionToTask(threadId, taskId, correction) !== 'task-not-found';
            case 'cancel-task': {
                if (!taskId)
                    return true;
                const isLocal = this.backgroundTasks
                    .getTaskSnapshots(threadId)
                    .some((task) => task.taskId === taskId);
                this.cancelBackgroundTask(threadId, taskId);
                return isLocal;
            }
            case 'cancel-thread':
                this.cancelRun(threadId);
                return false;
            case 'clear-thread':
                await this.clearThreadState(threadId, userId);
                return false;
        }
    }
    async routeTaskControl(payload) {
        const foundLocally = await this.applyTaskControlLocally(payload);
        if (!foundLocally)
            this.broadcastTaskControl(payload);
    }
    async routeCorrectionToTask(threadId, taskId, correction) {
        await this.routeTaskControl({ threadId, taskId, action: 'correct', correction });
    }
    async routeCancelBackgroundTask(threadId, taskId) {
        await this.routeTaskControl({ threadId, taskId, action: 'cancel-task' });
    }
    async routeCancelRun(threadId) {
        const hadLiveLocalRun = this.runState.hasLiveRun(threadId);
        await this.routeTaskControl({ threadId, action: 'cancel-thread' });
        if (!hadLiveLocalRun) {
            await this.eventLog.flush(threadId);
            await this.interruptedRunSweeper.cancelUnfinishedRuns(threadId);
        }
    }
    async routeClearThreadState(threadId, userId) {
        await this.routeTaskControl({
            threadId,
            action: 'clear-thread',
            ...(userId ? { userId } : {}),
        });
    }
    async handleRelayTaskControl(payload) {
        try {
            await this.applyTaskControlLocally(payload);
        }
        catch (error) {
            this.logger.error('Failed to apply relayed Instance AI task-control', {
                threadId: payload.threadId,
                taskId: payload.taskId,
                action: payload.action,
                error,
            });
        }
    }
    cancelAllBackgroundTasks() {
        const cancelled = this.backgroundTasks.cancelAll();
        for (const task of cancelled) {
            void this.tracing.finalizeBackgroundTaskTracing(task, 'cancelled');
        }
        return cancelled.length;
    }
    async startStuckBackgroundTaskForTest(user, threadId) {
        const messageId = `msg_${(0, nanoid_1.nanoid)()}`;
        const messageText = 'I started a background workflow-builder task.';
        const { runId, messageGroupId } = this.runState.startRun({ threadId, user });
        if (!messageGroupId) {
            throw new n8n_workflow_1.UnexpectedError('Failed to create message group for timeout simulation');
        }
        const taskId = `task_${(0, nanoid_1.nanoid)()}`;
        const agentId = `agent_${(0, nanoid_1.nanoid)()}`;
        this.eventBus.publish(threadId, {
            type: 'run-start',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            userId: user.id,
            payload: { messageId, messageGroupId },
        });
        this.eventBus.publish(threadId, {
            type: 'text-delta',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            responseId: `test-background-start:${runId}`,
            payload: { text: messageText },
        });
        this.eventBus.publish(threadId, {
            type: 'agent-spawned',
            runId,
            agentId,
            payload: {
                parentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                role: 'workflow-builder',
                tools: [],
                taskId,
                kind: 'builder',
                title: 'Building workflow',
                subtitle: 'Timeout simulation',
                goal: 'Simulate a stuck background task timeout',
            },
        });
        await this.agentMemory.saveMessages({
            threadId,
            resourceId: user.id,
            messages: [
                {
                    id: messageId,
                    createdAt: new Date(),
                    type: 'llm',
                    role: 'assistant',
                    content: [{ type: 'text', text: messageText }],
                },
            ],
        });
        const outcome = this.backgroundTasks.spawn({
            taskId,
            threadId,
            runId,
            role: 'workflow-builder',
            agentId,
            messageGroupId,
            run: async (signal) => await new Promise((resolve) => {
                signal.addEventListener('abort', () => resolve('aborted'), { once: true });
            }),
            onFailed: (task) => {
                this.eventBus.publish(threadId, {
                    type: 'agent-completed',
                    runId,
                    agentId,
                    payload: {
                        role: task.role,
                        result: '',
                        error: task.error ?? 'Unknown error',
                    },
                });
            },
            onSettled: async (task) => {
                await this.terminalOutcome.recordBackgroundTerminalOutcome(task);
            },
        });
        if (outcome.status !== 'started') {
            throw new n8n_workflow_1.UnexpectedError('Failed to start stuck background task simulation');
        }
        this.runState.clearActiveRun(threadId);
        this.eventBus.publish(threadId, {
            type: 'run-finish',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            userId: user.id,
            payload: { status: 'completed' },
        });
        return {
            threadId,
            runId,
            messageGroupId,
            taskId,
            agentId,
            timeoutAt: outcome.task.lastActivityAt + this.liveness.backgroundTaskIdleTimeoutMs + 1,
        };
    }
    async runLivenessSweepForTest(now) {
        await this.liveness.sweepTimedOutWork(now);
    }
    loadTraceEvents(slug, events) {
        this.tracing.loadTraceEvents(slug, events);
    }
    getTraceEvents(slug) {
        return this.tracing.getTraceEvents(slug);
    }
    hasRunningWorkForTest() {
        const threadIds = new Set(this.tracing.getTrackedThreadIds());
        for (const threadId of threadIds) {
            if (this.runState.getActiveRunId(threadId))
                return true;
            if (this.backgroundTasks.getRunningTasks(threadId).length > 0)
                return true;
        }
        return false;
    }
    activateTraceSlug(slug) {
        this.tracing.activateTraceSlug(slug);
    }
    clearTraceEvents(slug) {
        this.tracing.clearTraceEvents(slug);
    }
    async clearThreadState(threadId, userId) {
        this.liveness.clearThreadState(threadId);
        const { active, suspended } = this.runState.clearThread(threadId);
        if (active) {
            active.abortController.abort();
            await this.tracing.finalizeRunTracing(active.runId, active.tracing, {
                status: 'cancelled',
                reason: 'thread_cleared',
            });
        }
        if (suspended) {
            suspended.abortController.abort();
            await this.tracing.finalizeRunTracing(suspended.runId, suspended.tracing, {
                status: 'cancelled',
                reason: 'thread_cleared',
            });
        }
        for (const task of this.backgroundTasks.cancelThread(threadId)) {
            task.abortController.abort();
            await this.tracing.finalizeBackgroundTaskTracing(task, 'cancelled');
        }
        await this.tracing.finalizeRemainingMessageTraceRoots(threadId, {
            status: 'cancelled',
            reason: 'thread_cleared',
            metadata: { completion_source: 'service_cleanup' },
        });
        this.schedulerLocks.delete(threadId);
        this.failedInternalFollowUpStreaks.delete(threadId);
        this.domainAccessTrackersByThread.delete(threadId);
        this.evalCredentialAllowlists.clearThread(threadId);
        this.threadPushRef.delete(threadId);
        this.planRequestsByThread.delete(threadId);
        this.memoryTaskRegistry.clearThread(threadId);
        this.tracing.deleteTraceContextsForThread(threadId);
        await this.deleteAgentBuilderSessions(threadId);
        await this.sandboxService.destroySandbox(threadId, 'thread_cleanup', userId);
        await this.temporaryWorkflowService.reapForThreadCleanup(threadId);
        await this.suspendedThreads.dropPendingConfirmationsForThread(threadId);
        this.eventBus.clearThread(threadId);
    }
    async deleteAgentBuilderSessions(threadId) {
        if (!di_1.Container.get(backend_common_1.ModuleRegistry).isActive('agents'))
            return;
        try {
            await di_1.Container.get(instance_ai_builder_delegate_adapter_1.InstanceAiBuilderDelegateAdapterService).deleteBuilderSessions(threadId);
        }
        catch (error) {
            this.logger.warn('Failed to clean up agent-builder sessions for thread', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async shutdown() {
        this.liveness.shutdown();
        const { activeRuns, suspendedRuns, pendingThreadIds } = this.runState.shutdown();
        const threadsWithPendingHitl = new Set(pendingThreadIds);
        for (const run of activeRuns) {
            if (threadsWithPendingHitl.has(run.threadId)) {
                await this.tracing.finalizeRunTracing(run.runId, run.tracing, {
                    status: 'cancelled',
                    reason: 'service_shutdown',
                });
                this.preserveHitlOnShutdown.add(run.runId);
                run.abortController.abort();
                continue;
            }
            this.publishRunFinish(run.threadId, run.runId, 'cancelled', 'service_shutdown', undefined, undefined, { promptVersion: run.promptVersion });
            await this.tracing.finalizeRunTracing(run.runId, run.tracing, {
                status: 'cancelled',
                reason: 'service_shutdown',
            });
            run.abortController.abort();
        }
        for (const run of suspendedRuns) {
            await this.tracing.finalizeRunTracing(run.runId, run.tracing, {
                status: 'cancelled',
                reason: 'service_shutdown',
            });
            this.preserveHitlOnShutdown.add(run.runId);
            run.abortController.abort();
        }
        for (const task of this.backgroundTasks.cancelAll()) {
            task.abortController.abort();
            await this.tracing.finalizeBackgroundTaskTracing(task, 'cancelled');
        }
        await this.drainInFlightExecutions(INSTANCE_AI_SHUTDOWN_DRAIN_TIMEOUT_MS);
        this.instanceAiErrorReporter.endAllRuns();
        const threadsWithTraces = new Set(this.tracing.getTrackedThreadIds());
        for (const threadId of threadsWithTraces) {
            await this.tracing.finalizeRemainingMessageTraceRoots(threadId, {
                status: 'cancelled',
                reason: 'service_shutdown',
                metadata: { completion_source: 'service_cleanup' },
            });
        }
        this.gatewayService.disconnectAll();
        await this.browserSessionService.shutdown();
        this.sandboxService.stopSandboxExpiryTimers();
        this.domainAccessTrackersByThread.clear();
        this.tracing.clear();
        await this.eventLog.flushAll();
        this.eventBus.clear();
        await this._mcpClientManager?.disconnect();
        await (0, instance_ai_1.shutdownProductTelemetryProviders)();
        this.logger.debug('Instance AI service shut down');
    }
    trackInFlightExecution(promise) {
        const tracked = promise.finally(() => {
            this.inFlightExecutions.delete(tracked);
        });
        this.inFlightExecutions.add(tracked);
    }
    startExecuteRun(...args) {
        this.trackInFlightExecution(this.executeRun(...args));
    }
    startProcessResumedStream(...args) {
        this.trackInFlightExecution(this.processResumedStream(...args));
    }
    shouldPreserveHitlOnShutdown(runId) {
        return this.preserveHitlOnShutdown.has(runId);
    }
    async drainInFlightExecutions(timeoutMs) {
        if (this.inFlightExecutions.size === 0)
            return;
        const drain = Promise.allSettled([...this.inFlightExecutions]);
        const timeout = new Promise((resolve) => {
            setTimeout(() => resolve('timeout'), timeoutMs).unref();
        });
        const outcome = await Promise.race([drain.then(() => 'drained'), timeout]);
        if (outcome === 'timeout') {
            this.logger.warn('Timed out waiting for in-flight Instance AI runs to drain', {
                timeoutMs,
                stillInFlight: this.inFlightExecutions.size,
            });
        }
    }
    async pruneExpiredData(now = Date.now(), signal) {
        const olderThan = new Date(now - this.instanceAiConfig.snapshotRetention);
        const count = await this.checkpointStore.markExpiredOlderThan(olderThan);
        if (count > 0) {
            this.logger.info('Expired stale Instance AI checkpoints', { count });
        }
        else {
            this.logger.debug('No stale Instance AI checkpoints to expire');
        }
        if (!signal?.aborted)
            await this.hardDeleteExpiredCheckpoints(now);
        if (!signal?.aborted)
            await this.suspendedThreads.pruneStalePendingConfirmations(now);
        if (!signal?.aborted)
            await this.pruneExpiredThreads(signal);
        if (signal?.aborted) {
            this.logger.debug('Stopped the Instance AI prune pass early because the run was aborted');
        }
    }
    async hardDeleteExpiredCheckpoints(now) {
        const retention = this.instanceAiConfig.checkpointGcRetention;
        if (retention <= 0)
            return;
        try {
            const olderThan = new Date(now - retention);
            const count = await this.checkpointStore.hardDeleteExpiredOlderThan(olderThan);
            if (count > 0) {
                this.logger.info('Hard-deleted expired Instance AI checkpoint tombstones', { count });
            }
        }
        catch (error) {
            this.logger.warn('Failed to hard-delete expired Instance AI checkpoint tombstones', {
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    async pruneExpiredThreads(signal) {
        try {
            await this.memoryService.cleanupExpiredThreads(async (threadId) => await this.clearThreadState(threadId), signal);
        }
        catch (error) {
            this.logger.warn('Failed to clean up expired Instance AI conversation threads', {
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    createAgentMemoryOptions(user, threadId, runId, memoryModelId) {
        return {
            observationalMemory: {
                model: memoryModelId,
                observerThresholdTokens: this.runState.getObserverThresholdTokens(threadId) ??
                    this.instanceAiConfig.observerMessageTokens,
                reflectorThresholdTokens: this.instanceAiConfig.reflectorObservationTokens,
                midRunObservation: this.instanceAiConfig.midRunObservation,
                onTaskUsage: async (report) => {
                    try {
                        const items = (0, instance_ai_1.tokenUsageToBuilderUsageItems)(report.model, report.usage);
                        if (items.length === 0)
                            return;
                        await this.creditService.claimRunUsage(user, threadId, `${runId}:memory:${report.task}:${report.reportId}`, items, 'completed');
                    }
                    catch (error) {
                        this.logger.warn('Failed to claim observational-memory usage', {
                            threadId,
                            runId,
                            task: report.task,
                            error: (0, get_error_message_1.getErrorMessage)(error),
                        });
                    }
                },
            },
        };
    }
    createWorkflowTaskServiceWithUiSync(threadId, runId, workflowTasks) {
        const sync = async () => await this.taskProjector.syncFromWorkflowLoop(threadId, runId);
        return {
            reportBuildOutcome: async (outcome) => {
                const action = await workflowTasks.reportBuildOutcome(outcome);
                await sync();
                return action;
            },
            reportVerificationVerdict: async (verdict) => {
                const action = await workflowTasks.reportVerificationVerdict(verdict);
                await sync();
                return action;
            },
            updateBuildOutcome: async (workItemId, update) => {
                await workflowTasks.updateBuildOutcome(workItemId, update);
                await sync();
            },
            beginVerification: async (outcome, state, verificationRunId) => {
                const resumed = await workflowTasks.beginVerification(outcome, state, verificationRunId);
                if (resumed)
                    await sync();
                return resumed;
            },
            getBuildOutcome: async (workItemId) => await workflowTasks.getBuildOutcome(workItemId),
            startVerification: async (workItemId, triggerNodeName) => {
                const previousProgress = await workflowTasks.startVerification(workItemId, triggerNodeName);
                await sync();
                return previousProgress;
            },
            recordVerification: async (workItemId, verification, previousProgress) => {
                const claim = await workflowTasks.recordVerification(workItemId, verification, previousProgress);
                await sync();
                return claim;
            },
            getLatestBuildOutcomeForWorkflow: async (workflowId) => await workflowTasks.getLatestBuildOutcomeForWorkflow(workflowId),
            getWorkflowLoopState: async (workItemId) => await workflowTasks.getWorkflowLoopState(workItemId),
        };
    }
    trackWorkflowVerificationObligation(obligation, event, extra = {}) {
        try {
            this.telemetry?.track('instance_ai_workflow_verification_obligation', {
                event,
                thread_id: obligation.threadId,
                run_id: obligation.runId,
                task_id: obligation.taskId,
                planned_task_id: obligation.plannedTaskId,
                work_item_id: obligation.workItemId,
                workflow_id: obligation.workflowId,
                source: obligation.source,
                policy: obligation.policy,
                status: obligation.status,
                readiness_status: obligation.readiness?.status,
                setup_status: obligation.setupRequirement?.status,
                has_evidence: obligation.evidence?.attempted === true,
                evidence_success: obligation.evidence?.success,
                blocking_reason: obligation.blockingReason,
                ...extra,
            });
        }
        catch (error) {
            this.logger.warn('Failed to track workflow verification obligation telemetry', {
                threadId: obligation.threadId,
                workItemId: obligation.workItemId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    buildPlannedTaskFollowUpMessage(type, graph, options = {}) {
        const payload = {
            tasks: graph.tasks.map((task) => ({
                id: task.id,
                title: task.title,
                kind: task.kind,
                status: task.status,
                result: task.result,
                error: task.error,
                outcome: task.outcome,
            })),
        };
        if (options.failedTask) {
            payload.failedTask = {
                id: options.failedTask.id,
                title: options.failedTask.title,
                kind: options.failedTask.kind,
                error: options.failedTask.error,
                result: options.failedTask.result,
            };
        }
        if (options.checkpoint) {
            const depOutcomes = graph.tasks
                .filter((t) => options.checkpoint.deps.includes(t.id))
                .map((t) => ({
                id: t.id,
                title: t.title,
                kind: t.kind,
                status: t.status,
                result: t.result,
                outcome: t.outcome,
            }));
            payload.checkpoint = {
                id: options.checkpoint.id,
                title: options.checkpoint.title,
                instructions: options.checkpoint.spec,
                dependsOn: depOutcomes,
            };
        }
        if (options.buildTask) {
            payload.buildTask = {
                id: options.buildTask.id,
                title: options.buildTask.title,
                kind: options.buildTask.kind,
                spec: options.buildTask.spec,
                workflowId: options.buildTask.workflowId,
                isSupportingWorkflow: options.buildTask.isSupportingWorkflow,
                deps: options.buildTask.deps,
            };
        }
        return `<planned-task-follow-up type="${type}">\n${JSON.stringify(payload, null, 2)}\n</planned-task-follow-up>\n\n${internal_messages_1.AUTO_FOLLOW_UP_MESSAGE}`;
    }
    buildWorkflowVerificationFollowUpMessage(input) {
        const payload = {
            obligation: input.obligation,
            outcome: input.outcome,
            sourceTask: input.sourceTask,
        };
        return `<workflow-verification-follow-up>\n${JSON.stringify(payload, null, 2)}\n</workflow-verification-follow-up>\n\n${internal_messages_1.AUTO_FOLLOW_UP_MESSAGE}`;
    }
    async createPlannedTaskState() {
        const memory = this.agentMemory;
        const taskStorage = new instance_ai_1.ThreadTaskStorage(memory);
        const plannedTaskStorage = new instance_ai_1.PlannedTaskStorage(memory);
        const plannedTaskService = new instance_ai_1.PlannedTaskCoordinator(plannedTaskStorage);
        return { memory, taskStorage, plannedTaskService };
    }
    async replayUndeliveredTerminalOutcomes(threadId) {
        await this.terminalOutcome.replayUndeliveredTerminalOutcomes(threadId);
    }
    async syncPlannedTasksToUi(threadId, graph) {
        const { taskStorage } = await this.createPlannedTaskState();
        const tasks = await this.taskProjector.projectPlannedTaskList(threadId, graph);
        await taskStorage.save(threadId, tasks);
        this.eventBus.publish(threadId, {
            type: 'tasks-update',
            runId: graph.planRunId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(graph.planRunId),
            payload: { tasks },
        });
    }
    async cancelAwaitingApprovalPlan(threadId) {
        try {
            const { plannedTaskService, taskStorage } = await this.createPlannedTaskState();
            const graph = await plannedTaskService.getGraph(threadId);
            if (!graph || graph.status !== 'awaiting_approval')
                return;
            await plannedTaskService.clear(threadId);
            await taskStorage.save(threadId, { tasks: [] });
            this.eventBus.publish(threadId, {
                type: 'tasks-update',
                runId: graph.planRunId,
                agentId: (0, instance_ai_1.orchestratorAgentId)(graph.planRunId),
                payload: { tasks: { tasks: [] }, planItems: [] },
            });
        }
        catch (error) {
            this.logger.warn('Failed to clean up awaiting_approval plan on cancel', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    areMcpConnectionsAvailable() {
        return (di_1.Container.get(backend_common_1.ModuleRegistry).isActive('mcp-registry') &&
            this.settingsService.isMcpAccessEnabled());
    }
    async createExecutionEnvironment(user, threadId, runId, abortSignal, messageGroupId, pushRef, proxyRunConfig, instanceContextGates, experimentGates) {
        const memory = this.agentMemory;
        const boundProjectId = await memory.getThreadProjectId(threadId);
        if (!boundProjectId) {
            throw new n8n_workflow_1.UnexpectedError(`Instance AI thread "${threadId}" has no bound project; it must be created via POST /instance-ai/threads before a run can start`);
        }
        const adminSettings = await this.settingsService.getAdminSettings();
        const localGatewayDisabledGlobally = adminSettings.localGatewayDisabled;
        const browserUseEnabledGlobally = adminSettings.browserUseEnabled;
        const mcpConnectionsAvailable = this.areMcpConnectionsAvailable();
        const localGatewayDisabledForUser = await this.settingsService.isLocalGatewayDisabledForUser(user.id);
        const userGateway = this.gatewayService.findGateway(user.id);
        await this.assertAssistantCreditsAvailable(user);
        const { searchProxyConfig, tokenManager, proxyBaseUrl } = proxyRunConfig ?? (await this.createProxyRunConfig(user));
        const proxyContext = { runId, threadId };
        const modelId = proxyBaseUrl && tokenManager
            ? await this.modelService.resolveProxyModel(user, proxyBaseUrl, tokenManager, proxyContext)
            : await this.modelService.resolveAgentModelConfig(user, proxyContext);
        const memoryModelId = await this.modelService.resolveMemoryModelConfig(user, modelId, {
            proxyBaseUrl,
            tokenManager,
            proxyContext,
        });
        const gates = experimentGates ?? (await this.adapterService.resolveExperimentGates(user));
        const { configEvalsEnabled, conversationHistoryEnabled, progressiveBuildingEnabled, conciseStyleEnabled, setupPanelEnabled, setupPanelVariant, folderExplorationEnabled, credentialDescriptionsEnabled, aiPreferencesEnabled, } = gates;
        this.runState.setSetupPanelEnabled(threadId, setupPanelEnabled);
        const { instanceContextEnabled, nodeUsageEnabled } = instanceContextGates ?? gates;
        const conversationHistory = conversationHistoryEnabled
            ? this.conversationHistoryService.forContext(user.id, boundProjectId, threadId)
            : undefined;
        const mode = this.runState.getBuildMode(threadId) ??
            (progressiveBuildingEnabled ? 'progressive' : 'default');
        const selectedPrompt = (0, instance_ai_1.resolvePromptProfile)({
            version: this.runState.getPromptVersion(threadId) ??
                resolveOperatorPromptVersion(this.instanceAiConfig.promptVersion) ??
                (conciseStyleEnabled && mode === 'default' ? instance_ai_1.CONCISE_PROMPT_VERSION : undefined),
            mode,
        });
        const buildMode = selectedPrompt.profile.mode;
        this.runState.setBuildMode(threadId, buildMode);
        const allowSendingParameterValues = await this.aiUsageService.isParameterValueSharingAllowed();
        const thread = await memory.getThread(threadId);
        const onboardingThread = thread?.metadata?.source === 'onboarding' && !thread.metadata.onboardingLeft;
        const context = this.adapterService.createContext(user, {
            searchProxyConfig,
            pushRef,
            threadId,
            projectId: boundProjectId,
            getCredentialIdAllowlist: () => this.evalCredentialAllowlists.get(threadId),
            shouldBypassCredentialTest: (credentialId) => this.evalCredentialAllowlists.shouldBypassTest(threadId, credentialId),
            getCredentialTestTarget: (credentialType) => this.evalCredentialAllowlists.getTestTarget(threadId, credentialType),
            configEvalsEnabled,
            setupPanelVariant,
            mcpConnectionsAvailable,
            nodeUsageEnabled,
            instanceContextEnabled,
            conversationHistory,
            folderExplorationEnabled,
            onboardingThread,
            credentialDescriptionsEnabled,
            aiPreferencesEnabled,
            modelId,
            allowSendingParameterValues,
        });
        this.gatewayService.applyToolPolicy(user.id);
        const gatewayMcpServer = !localGatewayDisabledForUser && userGateway?.isConnected ? userGateway : undefined;
        const browserMcpServer = browserUseEnabledGlobally
            ? this.browserSessionService.findMcpServer(user.id)
            : undefined;
        const localMcpServer = (0, composite_local_mcp_server_1.composeLocalMcpServers)(gatewayMcpServer, browserMcpServer);
        if (localMcpServer) {
            context.localMcpServer = localMcpServer;
        }
        context.permissions = this.settingsService.getPermissions();
        if (this.instanceWriteAccess.isReadOnly()) {
            context.permissions = (0, api_types_1.applyBranchReadOnlyOverrides)(context.permissions);
            context.branchReadOnly = true;
        }
        context.runId = runId;
        if (setupPanelEnabled) {
            context.setupItemsEmitter = (0, instance_ai_1.createSetupItemsEmitter)({
                eventBus: this.eventBus,
                threadId,
                runId,
                agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                initialSnapshots: await this.eventLog.getSetupItemsSnapshots(threadId).catch((error) => {
                    this.logger.warn('Failed to read setup panel snapshots', {
                        threadId,
                        error: (0, get_error_message_1.getErrorMessage)(error),
                    });
                    return [];
                }),
                readPersistedSnapshot: async (workflowId) => {
                    const snapshots = await this.eventLog.getSetupItemsSnapshots(threadId);
                    return snapshots.find((snapshot) => snapshot.workflowId === workflowId)?.items;
                },
            });
            context.markWorkflowSetupHandled = async (workflowId) => {
                await this.markWorkflowSetupHandled(threadId, workflowId, runId, {
                    requirePersisted: true,
                });
            };
        }
        context.browserCredentialSetup = this.createBrowserCredentialSetupTracker(runId, user.id);
        context.onArtifactChanged = async (artifact) => {
            try {
                await this.threadTabsService.showArtifactTab(threadId, user.id, artifact);
            }
            catch (error) {
                this.logger.warn('Failed to show an Instance AI artifact tab', {
                    threadId,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
            }
        };
        const sessionGrants = await this.loadThreadSessionGrants(threadId, user.id);
        context.sessionApprovedToolKeys = sessionGrants;
        const grantSessionToolApproval = async (key) => {
            await this.persistThreadSessionGrant(threadId, user.id, key);
            sessionGrants.add(key);
        };
        context.grantSessionToolApproval = grantSessionToolApproval;
        context.revokeSessionToolApproval = async (key) => {
            await this.revokeThreadSessionGrant(threadId, user.id, key);
            sessionGrants.delete(key);
        };
        const domainTracker = (0, instance_ai_1.createDomainAccessTracker)({
            grantedKeys: sessionGrants,
            persistGrant: grantSessionToolApproval,
        });
        this.domainAccessTrackersByThread.set(threadId, domainTracker);
        context.domainAccessTracker = domainTracker;
        if (this.isRunDebugEnabled()) {
            context.recordWorkflowCodeSnapshot = (snapshot) => {
                this.runDebugBuffer.ensure(runId, threadId);
                this.runDebugBuffer.recordWorkflowCode(runId, snapshot);
            };
        }
        browserMcpServer?.setDomainGate({
            tracker: domainTracker,
            runId,
            permissionMode: context.permissions?.fetchUrl,
            createCredentialPermissionMode: context.permissions?.createCredential,
        });
        context.computerUseState = (0, computer_use_availability_1.resolveComputerUseState)({
            localGatewayDisabledGlobally,
            localGatewayDisabledForUser,
            browserUseEnabledGlobally,
            clientChannels: this.runState.getComputerUseChannels(threadId),
            localComputerToolCategories: gatewayMcpServer
                ? (0, computer_use_availability_1.enabledToolCategories)(gatewayMcpServer.getStatus().toolCategories)
                : undefined,
            browserConnected: browserMcpServer !== undefined,
        });
        const taskStorage = new instance_ai_1.ThreadTaskStorage(memory);
        const iterationLog = this.dbIterationLogStorage;
        const workflowLoopStorage = new instance_ai_1.WorkflowLoopStorage(memory);
        const workflowTasks = this.createWorkflowTaskServiceWithUiSync(threadId, runId, new instance_ai_1.WorkflowTaskCoordinator(threadId, workflowLoopStorage));
        const plannedTaskStorage = new instance_ai_1.PlannedTaskStorage(memory);
        const plannedTaskService = new instance_ai_1.PlannedTaskCoordinator(plannedTaskStorage);
        const nodeDefDirs = this.adapterService.getNodeDefinitionDirs();
        if (nodeDefDirs.length > 0) {
            (0, workflow_sdk_1.setSchemaBaseDirs)(nodeDefDirs);
        }
        const skillScope = {
            profile: selectedPrompt.profile,
            flags: { configEvalsEnabled, instanceContextEnabled },
            agentBuildingEnabled: context.builderDelegate !== undefined,
        };
        const skills = await this.skillsService.loadSkills(skillScope);
        const promptMetadata = (0, instance_ai_1.describePromptProfile)(selectedPrompt, skills.source);
        this.runState.setPromptConfiguration(threadId, promptMetadata);
        let runtimeWorkspace;
        let workspaceRoot;
        const sandboxStatus = this.settingsService.getSandboxStatus();
        if (sandboxStatus.workflowBuilderAvailable) {
            const sandboxConfig = await this.instanceAiErrorReporter.withBoundary('instance-ai-sandbox-setup', { threadId, runId, userId: user.id, messageGroupId }, async () => await this.sandboxService.resolveSandboxConfig(user));
            if (sandboxConfig.enabled) {
                workspaceRoot = (0, sandbox_1.getPromptWorkspaceRoot)(sandboxConfig.provider);
                const scopeWorkspaceForAgent = async (workspace) => {
                    if (!workspace)
                        return undefined;
                    const root = await (0, sandbox_1.getWorkspaceRoot)(workspace);
                    return (0, agents_1.createScopedWorkspace)(workspace, root);
                };
                runtimeWorkspace = (0, instance_ai_1.createLazyRuntimeWorkspace)({
                    sandboxInstructions: '',
                    filesystemInstructions: '',
                    ensureWorkspace: async () => await scopeWorkspaceForAgent((await this.sandboxService.getOrCreateWorkspace(threadId, user, context))?.workspace),
                });
            }
        }
        context.workspace = runtimeWorkspace;
        context.workspaceRoot = workspaceRoot;
        context.threadId = threadId;
        context.threadMemory = memory;
        context.trackTelemetry = (eventName, properties) => {
            this.telemetry.track(eventName, (0, telemetry_1.redactTelemetryProperties)(properties));
        };
        const orchestrationContext = {
            threadId,
            runId,
            messageGroupId,
            userId: user.id,
            projectId: boundProjectId,
            promptConfiguration: promptMetadata,
            disabledToolNames: new Set(skills.disabledTools),
            setupPanelEnabled: (0, instance_ai_1.isSetupPanelEnabled)(context),
            orchestratorAgentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            modelId,
            modelStreamStallOptions: (0, model_stream_stall_options_1.modelStreamStallOptions)(this.aiConfig),
            eventBus: this.eventBus,
            logger: this.logger,
            trackTelemetry: (eventName, properties) => {
                this.telemetry.track(eventName, (0, telemetry_1.redactTelemetryProperties)(properties));
            },
            claimSubAgentUsage: async (dedupeId, usage, status) => {
                try {
                    await this.creditService.claimRunUsage(user, threadId, dedupeId, usage, status);
                }
                catch (error) {
                    this.instanceAiErrorReporter.report(error, {
                        component: 'instance-ai-agent-builder-usage',
                        threadId,
                        runId,
                        userId: user.id,
                        ...(boundProjectId ? { projectId: boundProjectId } : {}),
                        ...(messageGroupId ? { messageGroupId } : {}),
                    });
                    this.logger.warn('Failed to claim agent-builder usage', {
                        threadId,
                        runId,
                        dedupeId,
                        error: (0, get_error_message_1.getErrorMessage)(error),
                    });
                }
            },
            abortSignal,
            taskStorage,
            timeZone: this.defaultTimeZone,
            localMcpServer: context.localMcpServer,
            skills: skills.source,
            oauth2CallbackUrl: this.oauth2CallbackUrl,
            cancelBackgroundTask: async (taskId) => this.cancelBackgroundTask(threadId, taskId),
            touchRun: () => this.runState.touchActiveRun(threadId),
            touchBackgroundTask: (taskId) => this.backgroundTasks.touchTask(threadId, taskId),
            plannedTaskService,
            schedulePlannedTasks: async () => await this.schedulePlannedTasks(user, threadId),
            iterationLog,
            sendCorrectionToTask: (taskId, correction) => this.sendCorrectionToTask(threadId, taskId, correction),
            workflowTaskService: workflowTasks,
            workspace: runtimeWorkspace,
            workspaceRoot,
            nodeDefinitionDirs: nodeDefDirs.length > 0 ? nodeDefDirs : undefined,
            domainContext: context,
        };
        return {
            context,
            memory,
            taskStorage,
            iterationLog,
            workflowTasks,
            plannedTaskService,
            modelId,
            memoryModelId,
            orchestrationContext,
            conversationHistory,
            aiPreferencesEnabled,
            instanceContextEnabled,
            nodeUsageEnabled,
            skillScope,
        };
    }
    getAgentExecutionService() {
        if (!(0, agents_access_1.isAgentsAccessEnabled)())
            return null;
        try {
            return di_1.Container.get(agent_execution_service_1.AgentExecutionService);
        }
        catch {
            return null;
        }
    }
    async bindAgentContextReader(context, user) {
        const projectId = context.projectId;
        if (!projectId)
            return;
        if (!(await (0, check_access_1.userHasScopes)(user, ['agent:read'], false, { projectId })))
            return;
        if (!(0, agents_access_1.isAgentsAccessEnabled)())
            return;
        context.agentContextService = di_1.Container.get(instance_ai_agent_context_adapter_1.InstanceAiAgentContextAdapterService).createReader(user, projectId);
    }
    async bindAgentPreviewSession(context, user) {
        await (0, instance_ai_1.resolveAgentPreviewSession)(context);
        const projectId = context.projectId;
        if (!context.agentPreviewSession || !projectId)
            return;
        if (!(0, agents_access_1.isAgentsAccessEnabled)()) {
            context.agentPreviewSession = undefined;
            return;
        }
        if (!(await this.canAccessAgentPreviewHandoff(user, projectId))) {
            context.agentPreviewSession = undefined;
            return;
        }
        context.resolvePreviewSession = async (ref) => {
            const service = this.getAgentExecutionService();
            if (!service)
                return null;
            const detail = await service.getThreadDetail(ref.threadId, projectId, ref.agentId, user.id);
            if (!detail)
                return null;
            const transcript = (0, format_preview_context_1.formatPreviewSessionContext)(detail.thread, detail.executions, ref.executionId);
            if (transcript === null)
                return null;
            return {
                title: detail.thread.title?.trim() || `Session #${detail.thread.sessionNumber}`,
                sessionNumber: detail.thread.sessionNumber,
                transcript,
            };
        };
    }
    async dispatchPlannedTask(task, context, _graph) {
        if (task.kind === 'build-workflow' || task.kind === 'checkpoint') {
            this.logger.warn('dispatchPlannedTask called for a runtime planned-task kind', {
                threadId: context.threadId,
                taskId: task.id,
                kind: task.kind,
            });
            return;
        }
        await context.plannedTaskService?.markFailed(context.threadId, task.id, {
            error: `Planned task kind "${task.kind}" is no longer supported`,
        });
        const nextGraph = await context.plannedTaskService?.getGraph(context.threadId);
        if (nextGraph) {
            await this.syncPlannedTasksToUi(context.threadId, nextGraph);
        }
    }
    collectWorkflowIds(value, workflowIds) {
        if (value === null || value === undefined || typeof value !== 'object')
            return;
        if (Array.isArray(value)) {
            for (const item of value) {
                this.collectWorkflowIds(item, workflowIds);
            }
            return;
        }
        for (const [key, child] of Object.entries(value)) {
            if (key === 'workflowId' && typeof child === 'string' && child.length > 0) {
                workflowIds.add(child);
                continue;
            }
            if (key === 'supportingWorkflowIds' && Array.isArray(child)) {
                for (const workflowId of child) {
                    if (typeof workflowId === 'string' && workflowId.length > 0) {
                        workflowIds.add(workflowId);
                    }
                }
                continue;
            }
            this.collectWorkflowIds(child, workflowIds);
        }
    }
    getBuildTaskWorkflowName(task) {
        if (task.kind !== 'build-workflow')
            return undefined;
        const titleMatch = task.title.match(/^Build '(.+)' workflow$/) ?? task.title.match(/^Build "(.+)" workflow$/);
        return titleMatch?.[1];
    }
    checkpointRequiresRunApproval(graph, _checkpoint) {
        return graph.postBuildRunApprovalRequired === true;
    }
    async getCheckpointRunPolicy(threadId, checkpointTaskId) {
        try {
            const { plannedTaskService } = await this.createPlannedTaskState();
            const graph = await plannedTaskService.getGraph(threadId);
            const checkpoint = graph?.tasks.find((t) => t.id === checkpointTaskId);
            if (!graph || !checkpoint) {
                return {
                    allowedWorkflowIds: new Set(),
                    allowedWorkflowNames: new Set(),
                    requireApproval: false,
                };
            }
            const deps = new Set(checkpoint.deps);
            const ids = new Set();
            const names = new Set();
            for (const task of graph.tasks) {
                if (!deps.has(task.id))
                    continue;
                const workflowName = this.getBuildTaskWorkflowName(task);
                if (workflowName) {
                    names.add(workflowName);
                }
                if (task.workflowId) {
                    ids.add(task.workflowId);
                }
                this.collectWorkflowIds(task.outcome, ids);
            }
            const tracing = this.tracing.getTraceContextForContinuation(threadId);
            for (const workflowId of [...ids]) {
                const remappedWorkflowId = tracing?.idRemapper?.remapOutput(workflowId);
                if (typeof remappedWorkflowId === 'string' && remappedWorkflowId.length > 0) {
                    ids.add(remappedWorkflowId);
                }
            }
            return {
                allowedWorkflowIds: ids,
                allowedWorkflowNames: names,
                requireApproval: this.checkpointRequiresRunApproval(graph, checkpoint),
            };
        }
        catch (error) {
            this.logger.warn('Failed to resolve checkpoint allowed workflow IDs', {
                threadId,
                checkpointTaskId,
                error: error instanceof Error ? error.message : String(error),
            });
            return {
                allowedWorkflowIds: new Set(),
                allowedWorkflowNames: new Set(),
                requireApproval: false,
            };
        }
    }
    async handlePlannedTaskSettlement(user, task, status, { reschedule = true } = {}) {
        if (!task.plannedTaskId)
            return;
        const { plannedTaskService } = await this.createPlannedTaskState();
        let graph = null;
        if (status === 'succeeded') {
            graph = await plannedTaskService.markSucceeded(task.threadId, task.plannedTaskId, {
                result: task.result,
                outcome: task.outcome,
            });
        }
        else if (status === 'failed') {
            graph = await plannedTaskService.markFailed(task.threadId, task.plannedTaskId, {
                error: task.error,
            });
        }
        else {
            graph = await plannedTaskService.markCancelled(task.threadId, task.plannedTaskId, {
                error: task.error,
            });
        }
        if (graph) {
            await this.syncPlannedTasksToUi(task.threadId, graph);
        }
        if (!reschedule)
            return;
        await this.schedulePlannedTasks(user, task.threadId);
    }
    async buildWorkflowSetupStateBlock(context) {
        const emitter = context.setupItemsEmitter;
        if (!emitter)
            return '';
        const workflowIds = emitter.workflowIds().reverse();
        if (workflowIds.length === 0)
            return '';
        try {
            const note = (0, instance_ai_1.formatWorkflowSetupStateNote)(await (0, instance_ai_1.observeWorkflowSetupStates)(context, workflowIds));
            return note
                ? `${internal_messages_1.WORKFLOW_SETUP_STATE_OPEN_TAG}\n${note}\n${internal_messages_1.WORKFLOW_SETUP_STATE_CLOSE_TAG}`
                : '';
        }
        catch (error) {
            this.logger.warn('Failed to build the workflow setup state block', {
                threadId: context.threadId,
                error: error instanceof Error ? error.message : String(error),
            });
            return '';
        }
    }
    buildWorkflowSetupFollowUpMessage(obligation) {
        const payload = {
            workflowId: obligation.workflowId,
            workItemId: obligation.workItemId,
            setupRequirement: obligation.setupRequirement,
            verificationReadiness: obligation.readiness,
        };
        return `<workflow-setup-required>\n${JSON.stringify(payload, null, 2)}\n</workflow-setup-required>\n\n${internal_messages_1.AUTO_FOLLOW_UP_MESSAGE}`;
    }
    getWorkflowSetupSuspensionWorkflowId(toolName, suspendPayload) {
        if (!toolName || !suspendPayload)
            return undefined;
        if ((0, api_types_1.resolveBuilderToolName)(toolName) !== api_types_1.WORKFLOW_BUILDER_TOOL_NAMES.WORKFLOWS)
            return undefined;
        if (!Array.isArray(suspendPayload.setupRequests))
            return undefined;
        return typeof suspendPayload.workflowId === 'string' ? suspendPayload.workflowId : undefined;
    }
    async markWorkflowSetupHandled(threadId, workflowId, runId, options = {}) {
        const records = await this.listWorkflowLoopRecords(threadId);
        if (records.length === 0)
            return false;
        const candidates = [];
        for (const record of records) {
            if (record.state.setupRoutedAt)
                continue;
            if (this.workflowObligations.isPlannedRecord(record))
                continue;
            const obligation = this.workflowObligations.obligationFromRecord(threadId, record, {
                source: 'direct',
            });
            if (obligation.workflowId !== workflowId)
                continue;
            if (obligation.setupRequirement?.status !== 'required')
                continue;
            candidates.push({ record, obligation });
        }
        const sameRunCandidates = runId
            ? candidates.filter(({ obligation, record }) => obligation.runId === runId || record.state.runId === runId)
            : [];
        const fallbackCandidates = candidates.filter((candidate) => !sameRunCandidates.includes(candidate));
        for (const { record, obligation } of [...sameRunCandidates, ...fallbackCandidates]) {
            const claim = await this.claimWorkItemSetupRouting(threadId, record);
            if (!claim)
                continue;
            let marked;
            try {
                marked = await this.markWorkItemSetupRouted(threadId, record.state.workItemId, claim.claimId);
            }
            catch (error) {
                await this.releaseWorkItemSetupRoutingClaim(threadId, record.state.workItemId, claim.claimId);
                throw error;
            }
            if (!marked) {
                await this.releaseWorkItemSetupRoutingClaim(threadId, record.state.workItemId, claim.claimId);
                if (options.requirePersisted) {
                    throw new n8n_workflow_1.OperationalError('Workflow setup routing marker was not saved');
                }
                this.logger.warn('Workflow setup completed but routing marker was not saved', {
                    threadId,
                    workItemId: record.state.workItemId,
                    workflowId,
                });
                continue;
            }
            this.trackWorkflowVerificationObligation(obligation, 'setup_completed_by_tool');
            return true;
        }
        return false;
    }
    async maybeStartWorkflowSetupFollowUp(user, threadId) {
        const records = await this.listWorkflowLoopRecords(threadId);
        if (records.length === 0)
            return false;
        for (const record of records) {
            if (record.state.setupRoutedAt)
                continue;
            if (this.workflowObligations.isPlannedRecord(record))
                continue;
            const obligation = this.workflowObligations.obligationFromRecord(threadId, record, {
                source: 'direct',
            });
            const verificationConcluded = obligation.status === 'verified' ||
                obligation.status === 'needs_setup' ||
                obligation.status === 'not_verifiable';
            if (!verificationConcluded)
                continue;
            if (obligation.setupRequirement?.status !== 'required' || !obligation.workflowId)
                continue;
            const claim = await this.claimWorkItemSetupRouting(threadId, record);
            if (!claim)
                continue;
            const startedRunId = await this.startInternalFollowUpRun(user, threadId, this.buildWorkflowSetupFollowUpMessage(obligation), this.runState.getMessageGroupId(threadId), false, undefined, 'workflow_setup');
            if (startedRunId.length === 0) {
                await this.releaseWorkItemSetupRoutingClaim(threadId, record.state.workItemId, claim.claimId);
                return false;
            }
            const marked = await this.markWorkItemSetupRouted(threadId, record.state.workItemId, claim.claimId);
            if (!marked) {
                this.logger.warn('Workflow setup follow-up started but routing marker was not saved', {
                    threadId,
                    workItemId: record.state.workItemId,
                });
            }
            this.trackWorkflowVerificationObligation(obligation, 'setup_follow_up_started');
            return true;
        }
        return false;
    }
    async listWorkflowLoopRecords(threadId) {
        return await new instance_ai_1.WorkflowLoopStorage(this.agentMemory).listWorkItems(threadId);
    }
    createWorkflowSetupRoutingClaim() {
        const claimedAt = new Date();
        const expiresAt = new Date(claimedAt.getTime() + WORKFLOW_SETUP_ROUTING_CLAIM_TTL_MS);
        return {
            claimId: `setup:${(0, nanoid_1.nanoid)()}`,
            claimedAt: claimedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
        };
    }
    async claimWorkItemSetupRouting(threadId, record) {
        const claim = this.createWorkflowSetupRoutingClaim();
        const claimed = await new instance_ai_1.WorkflowLoopStorage(this.agentMemory).claimSetupRouting(threadId, record.state.workItemId, claim);
        return claimed ? claim : null;
    }
    async markWorkItemSetupRouted(threadId, workItemId, claimId) {
        return await new instance_ai_1.WorkflowLoopStorage(this.agentMemory).markSetupRouted(threadId, workItemId, claimId, new Date().toISOString());
    }
    async releaseWorkItemSetupRoutingClaim(threadId, workItemId, claimId) {
        await new instance_ai_1.WorkflowLoopStorage(this.agentMemory).releaseSetupRoutingClaim(threadId, workItemId, claimId);
    }
    updateInternalFollowUpFailureStreak(threadId, status, isInternalFollowUp) {
        if (status === 'completed' || status === 'suspended') {
            this.failedInternalFollowUpStreaks.delete(threadId);
            return;
        }
        if (status === 'error' && isInternalFollowUp) {
            this.failedInternalFollowUpStreaks.set(threadId, (this.failedInternalFollowUpStreaks.get(threadId) ?? 0) + 1);
        }
    }
    async startInternalFollowUpRun(user, threadId, message, messageGroupId, isReplanFollowUp = false, checkpoint, resumeReasonOverride, plannedBuild) {
        if (this.runState.hasLiveRun(threadId)) {
            this.logger.warn('Skipping internal follow-up: active run exists', { threadId });
            return '';
        }
        const failedStreak = this.failedInternalFollowUpStreaks.get(threadId) ?? 0;
        if (failedStreak >= MAX_CONSECUTIVE_FAILED_INTERNAL_FOLLOW_UPS) {
            this.logger.warn('Skipping internal follow-up: consecutive follow-up runs keep failing', {
                threadId,
                failedStreak,
                resumeReason: resumeReasonOverride,
            });
            return '';
        }
        const { runId, abortController } = this.runState.startRun({
            threadId,
            user,
            messageGroupId,
        });
        const timeZone = this.runState.getTimeZone(threadId) ?? this.defaultTimeZone;
        const resumeReason = resumeReasonOverride ??
            (checkpoint
                ? 'planned_checkpoint'
                : isReplanFollowUp
                    ? 'replan'
                    : 'background_task_completed');
        this.startExecuteRun(user, threadId, runId, message, abortController, undefined, undefined, messageGroupId, timeZone, isReplanFollowUp, checkpoint, resumeReason, plannedBuild);
        return runId;
    }
    async schedulePlannedTasks(user, threadId) {
        const prev = this.schedulerLocks.get(threadId) ?? Promise.resolve();
        const current = prev.then(() => this.doSchedulePlannedTasks(user, threadId)).catch(() => { });
        this.schedulerLocks.set(threadId, current);
        await current;
    }
    createPlannedTaskActionRunner(activeUser, threadId, plannedTaskService) {
        const scope = { user: activeUser, threadId };
        return new planned_task_action_runner_1.PlannedTaskActionRunner({
            scope,
            plannedTaskService,
            logger: this.logger,
            view: this.createPlannedTaskView(),
            runGate: this.createPlannedTaskRunGate(),
            dispatcher: this.createPlannedTaskDispatcher(),
            followUps: this.createPlannedTaskFollowUps(),
            workflowVerificationGate: this.createPlannedWorkflowVerificationGate(threadId),
            workflowVerificationTracker: this.createPlannedWorkflowVerificationTracker(),
        });
    }
    createPlannedTaskView() {
        return {
            sync: async (scope, graph) => await this.syncPlannedTasksToUi(scope.threadId, graph),
        };
    }
    createPlannedTaskRunGate() {
        return {
            hasLiveRun: (threadId) => this.runState.hasLiveRun(threadId),
        };
    }
    createPlannedTaskDispatcher() {
        return {
            dispatch: async ({ scope, graph, tasks }) => {
                const context = await this.createPlannedTaskDispatchContext(scope.user, scope.threadId, graph);
                for (const task of tasks) {
                    await this.dispatchPlannedTask(task, context, graph);
                }
            },
        };
    }
    createPlannedTaskFollowUps() {
        return {
            startReplan: async ({ scope, graph, failedTask }) => await this.startInternalFollowUpRun(scope.user, scope.threadId, this.buildPlannedTaskFollowUpMessage('replan', graph, { failedTask }), graph.messageGroupId, true, undefined, undefined, undefined),
            startWorkflowVerification: async ({ scope, graph, verification }) => await this.startInternalFollowUpRun(scope.user, scope.threadId, this.buildWorkflowVerificationFollowUpMessage({
                obligation: verification.obligation,
                outcome: verification.outcome,
                sourceTask: this.toWorkflowVerificationSourceTask(verification),
            }), graph.messageGroupId, false, undefined, 'workflow_verification', undefined),
            startSynthesis: async ({ scope, graph }) => await this.startInternalFollowUpRun(scope.user, scope.threadId, this.buildPlannedTaskFollowUpMessage('synthesize', graph), graph.messageGroupId, false, undefined, 'synthesize', undefined),
            startWorkflowBuild: async ({ scope, graph, task, workItemId }) => {
                const plannedBuild = {
                    isPlannedBuildFollowUp: true,
                    buildTaskId: task.id,
                    workItemId,
                    isSupportingWorkflowTask: task.isSupportingWorkflow === true,
                };
                return await this.startInternalFollowUpRun(scope.user, scope.threadId, this.buildPlannedTaskFollowUpMessage('build-workflow', graph, { buildTask: task }), graph.messageGroupId, false, undefined, undefined, plannedBuild);
            },
            startCheckpoint: async ({ scope, graph, task }) => await this.startInternalFollowUpRun(scope.user, scope.threadId, this.buildPlannedTaskFollowUpMessage('checkpoint', graph, { checkpoint: task }), graph.messageGroupId, false, { isCheckpointFollowUp: true, checkpointTaskId: task.id }, undefined, undefined),
        };
    }
    createPlannedWorkflowVerificationGate(threadId) {
        return {
            revalidate: async (verification) => await this.workflowObligations.revalidatePlannedWorkflowVerification(threadId, verification),
        };
    }
    toWorkflowVerificationSourceTask(verification) {
        return {
            taskId: verification.task.backgroundTaskId ?? verification.task.id,
            role: 'workflow-builder',
            status: 'completed',
            result: verification.task.result,
            error: verification.task.error,
            plannedTaskId: verification.task.id,
            workItemId: verification.obligation.workItemId,
        };
    }
    createPlannedWorkflowVerificationTracker() {
        return {
            scheduled: ({ obligation }) => this.trackWorkflowVerificationObligation(obligation, 'planned_verification_scheduled'),
            followUpStartAttempted: ({ obligation }, started) => this.trackWorkflowVerificationObligation(obligation, 'follow_up_start_attempted', {
                follow_up_started: started,
            }),
        };
    }
    async createPlannedTaskDispatchContext(user, threadId, graph) {
        const environment = await this.createExecutionEnvironment(user, threadId, graph.planRunId, createInertAbortSignal(), graph.messageGroupId, this.threadPushRef.get(threadId));
        environment.orchestrationContext.tracing = this.tracing.getTraceContext(graph.planRunId);
        return environment.orchestrationContext;
    }
    async doSchedulePlannedTasks(user, threadId) {
        const revalidated = await this.revalidateActiveUser(user.id);
        if (!revalidated) {
            this.logger.warn('Cancelling run: user no longer authorized for n8n Assistant', {
                userId: user.id,
                threadId,
            });
            this.cancelRun(threadId);
            return;
        }
        const activeUser = revalidated;
        const { plannedTaskService } = await this.createPlannedTaskState();
        const actionRunner = this.createPlannedTaskActionRunner(activeUser, threadId, plannedTaskService);
        while (true) {
            const graph = await plannedTaskService.getGraph(threadId);
            if (!graph)
                return;
            await this.syncPlannedTasksToUi(threadId, graph);
            const availableSlots = Math.max(0, MAX_CONCURRENT_BACKGROUND_TASKS_PER_THREAD -
                this.backgroundTasks.getRunningTasks(threadId).length);
            const pendingWorkflowVerification = await this.workflowObligations.findPendingPlannedWorkflowVerification(threadId, graph);
            const action = await plannedTaskService.tick(threadId, {
                availableSlots,
                pendingWorkflowVerification,
            });
            if (action.type === 'none')
                return;
            const result = await actionRunner.run(action);
            if (result.type !== 'continue-scheduling')
                return;
        }
    }
    async persistInterruptedUserMessage(threadId, userId, message, createdAt) {
        if (!message)
            return;
        try {
            await this.agentMemory.saveMessages({
                threadId,
                resourceId: userId,
                messages: [
                    {
                        id: (0, nanoid_1.nanoid)(),
                        createdAt,
                        type: 'llm',
                        role: 'user',
                        content: [{ type: 'text', text: message }],
                    },
                ],
            });
        }
        catch (error) {
            this.logger.warn('Failed to persist user message on cancel', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    resolveContextAttachments(attachments, nodeContextEnabled) {
        const attachmentsOrEmpty = attachments ?? [];
        const workflowAttachments = attachmentsOrEmpty.filter((attachment) => attachment.type === 'workflow');
        const agentAttachments = attachmentsOrEmpty.filter((attachment) => attachment.type === 'agent');
        const nodeAttachments = attachmentsOrEmpty.filter((attachment) => attachment.type === 'nodes');
        return [
            ...workflowAttachments,
            ...agentAttachments,
            ...(nodeContextEnabled ? nodeAttachments : []),
        ];
    }
    async readThreadProvenance(userId, threadId) {
        try {
            return (0, instance_ai_1.threadProvenanceMetadata)(await this.memoryService.getThreadMetadata(userId, threadId));
        }
        catch (error) {
            this.logger.debug('Could not read thread provenance for tracing', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
            return {};
        }
    }
    async executeRun(user, threadId, runId, message, abortController, attachments, handoffContext, messageGroupId, timeZone, isReplanFollowUp = false, checkpoint, resumeReason, plannedBuild, threadArtifacts) {
        const fileAttachments = (attachments ?? []).filter((attachment) => attachment.type === 'file');
        const experimentGates = await this.adapterService.resolveExperimentGates(user);
        const contextAttachments = this.resolveContextAttachments(attachments, experimentGates.nodeContextEnabled);
        const signal = abortController.signal;
        let tracing;
        let promptVersion;
        let modelId;
        let messageTraceFinalization;
        let aiCreatedWorkflowIds;
        let messageId = '';
        let streamReached = false;
        let turnHadFileAttachments = false;
        const turnStartedAt = new Date();
        let errorReporterExecutionToken;
        let contextTurn;
        let contextResult;
        let contextSegmentReported = false;
        let blockedForQuota = false;
        const observedContextWork = new instance_ai_1.WorkSummaryAccumulator();
        const contextEventBus = this.observeInstanceContextEvents(observedContextWork);
        try {
            errorReporterExecutionToken = this.instanceAiErrorReporter.beginRun(runId);
            messageId = (0, nanoid_1.nanoid)();
            const traceInput = { message };
            if (fileAttachments.length) {
                traceInput.attachments = fileAttachments.map((attachment) => ({
                    mimeType: attachment.mimeType,
                    size: attachment.data.length,
                }));
            }
            if (contextAttachments.length) {
                traceInput.resourceAttachments = contextAttachments.map((attachment) => {
                    if (attachment.type === 'nodes') {
                        return { type: attachment.type, id: attachment.workflowId };
                    }
                    const resource = {
                        type: attachment.type,
                        id: attachment.id,
                    };
                    if (attachment.type === 'agent') {
                        resource.projectId = attachment.projectId;
                    }
                    if (attachment.type === 'workflow' && attachment.executionId) {
                        resource.executionId = attachment.executionId;
                    }
                    return resource;
                });
            }
            if (threadArtifacts?.artifacts.length) {
                traceInput.threadArtifacts = threadArtifacts;
            }
            if (messageGroupId) {
                traceInput.messageGroupId = messageGroupId;
            }
            const proxyRunConfig = await this.createProxyRunConfig(user);
            const browserExtension = this.browserSessionService.getExtensionTraceContext(user.id);
            const threadProvenance = await this.readThreadProvenance(user.id, threadId);
            if (resumeReason) {
                tracing = await this.tracing.createOrchestratorResumeTraceContext({
                    threadId,
                    messageId,
                    messageGroupId,
                    runId,
                    userId: user.id,
                    input: traceInput,
                    resumeReason,
                    metadata: {
                        ...threadProvenance,
                        ...(checkpoint?.isCheckpointFollowUp
                            ? { checkpoint_task_id: checkpoint.checkpointTaskId }
                            : {}),
                        ...(plannedBuild?.isPlannedBuildFollowUp
                            ? { build_task_id: plannedBuild.buildTaskId }
                            : {}),
                    },
                    browserExtension,
                });
            }
            else {
                tracing = await (0, instance_ai_1.createInstanceAiTraceContext)({
                    threadId,
                    messageId,
                    messageGroupId,
                    runId,
                    userId: user.id,
                    input: traceInput,
                    metadata: threadProvenance,
                    proxyConfig: proxyRunConfig.tracingProxyConfig,
                    n8nVersion: constants_1.N8N_VERSION,
                    workflowSdkVersion: constants_1.WORKFLOW_SDK_VERSION,
                    browserExtension,
                });
            }
            if (this.isRunDebugEnabled()) {
                this.runDebugBuffer.ensure(runId, threadId, (0, instance_ai_1.buildRunDebugLabel)({ message, resumeReason }));
            }
            const traceId = tracing?.rootRun.otelTraceId;
            const langsmithRunId = tracing?.rootRun.id;
            const langsmithTraceId = tracing?.rootRun.traceId;
            this.eventBus.publish(threadId, {
                type: 'run-start',
                runId,
                agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                userId: user.id,
                payload: {
                    messageId,
                    messageGroupId,
                    ...(traceId ? { traceId } : {}),
                    ...(langsmithRunId ? { langsmithRunId } : {}),
                    ...(langsmithTraceId ? { langsmithTraceId } : {}),
                },
            });
            if (signal.aborted) {
                const quotaAbort = quotaExhaustedFromSignal(signal);
                if (quotaAbort)
                    throw quotaAbort;
                await this.persistInterruptedUserMessage(threadId, user.id, message, turnStartedAt);
                await this.terminalOutcome.evaluateTerminalResponse(threadId, runId, 'cancelled', {
                    messageGroupId,
                    correlationId: messageId,
                });
                this.eventBus.publish(threadId, {
                    type: 'run-finish',
                    runId,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                    payload: { status: 'cancelled', reason: 'user_cancelled' },
                });
                return;
            }
            const executionPushRef = this.threadPushRef.get(threadId);
            const environment = await this.createExecutionEnvironment(user, threadId, runId, signal, messageGroupId, executionPushRef, proxyRunConfig, undefined, experimentGates);
            const { context, memory, taskStorage, workflowTasks, plannedTaskService, modelId: resolvedModelId, orchestrationContext, conversationHistory, aiPreferencesEnabled, instanceContextEnabled, nodeUsageEnabled, skillScope, } = environment;
            modelId = resolvedModelId;
            promptVersion = orchestrationContext.promptConfiguration?.version;
            (0, instance_ai_1.setTracePromptVersion)(tracing, promptVersion);
            (0, instance_ai_1.setTraceModelId)(tracing, modelId);
            aiCreatedWorkflowIds = context.aiCreatedWorkflowIds ??= new Set();
            const isPostPlanFollowUp = isReplanFollowUp || checkpoint?.isCheckpointFollowUp === true;
            orchestrationContext.currentUserMessage = message;
            orchestrationContext.isReplanFollowUp = isReplanFollowUp;
            orchestrationContext.timeZone = timeZone ?? this.defaultTimeZone;
            if (checkpoint?.isCheckpointFollowUp) {
                orchestrationContext.isCheckpointFollowUp = true;
                orchestrationContext.checkpointTaskId = checkpoint.checkpointTaskId;
                context.permissions = {
                    ...context.permissions,
                    ...(instance_ai_1.PLANNED_TASK_PERMISSION_OVERRIDES.checkpoint ?? {}),
                };
                const runPolicy = await this.getCheckpointRunPolicy(threadId, checkpoint.checkpointTaskId);
                context.allowedRunWorkflowIds = runPolicy.allowedWorkflowIds;
                context.allowedRunWorkflowNames = runPolicy.allowedWorkflowNames;
                context.requireRunWorkflowApproval = runPolicy.requireApproval;
            }
            if (plannedBuild?.isPlannedBuildFollowUp) {
                context.permissions = {
                    ...context.permissions,
                    ...(instance_ai_1.PLANNED_TASK_PERMISSION_OVERRIDES['build-workflow'] ?? {}),
                };
                context.workflowBuildContext = {
                    threadId,
                    runId,
                    taskId: plannedBuild.buildTaskId,
                    workItemId: plannedBuild.workItemId,
                    allowPostPlanWorkflowCreate: true,
                    isSupportingWorkflowTask: plannedBuild.isSupportingWorkflowTask,
                    plannedTaskService,
                    workflowTaskService: workflowTasks,
                    onBuildOutcome: (outcome) => {
                        plannedBuild.savedOutcome = outcome;
                    },
                };
            }
            else {
                context.workflowBuildContext = {
                    threadId,
                    runId,
                    taskId: `build-${runId}`,
                    workItemId: `wi_${(0, nanoid_1.nanoid)(8)}`,
                    allowPostPlanWorkflowCreate: isPostPlanFollowUp,
                    workflowTaskService: workflowTasks,
                };
            }
            if (fileAttachments.length > 0) {
                context.currentUserAttachments = fileAttachments;
            }
            if (!tracing && process.env.E2E_TESTS === 'true') {
                const { createTraceReplayOnlyContext } = await (0, lazy_import_1.lazyImport)(async () => await import('@n8n/instance-ai'));
                tracing = createTraceReplayOnlyContext();
            }
            if (tracing) {
                orchestrationContext.tracing = tracing;
                if (this.tracing.getTraceContext(runId) !== tracing) {
                    await this.tracing.configureTraceReplayMode(tracing);
                    this.runState.attachTracing(threadId, tracing);
                    this.tracing.storeTraceContext(runId, threadId, tracing, messageGroupId);
                }
            }
            await this.snapshotAttachedAgents(contextAttachments, orchestrationContext, tracing);
            const enrichedMessage = await this.buildMessageWithRunningTasks(threadId, message);
            let handoffContextBlock = '';
            let agentPreviewTitleFallback;
            if (handoffContext?.source === 'agent-preview') {
                const projectId = context.projectId;
                if (!projectId) {
                    throw new n8n_workflow_1.UnexpectedError(`Instance AI thread "${threadId}" has no bound project; agent-preview handoff requires a project`);
                }
                await this.assertAgentPreviewHandoffScopes(user, projectId);
                const agentExecutionService = this.getAgentExecutionService();
                if (!agentExecutionService) {
                    throw new n8n_workflow_1.UserError('Agent preview handoff is not available');
                }
                const resolved = await (0, agent_preview_handoff_1.resolveAgentPreviewHandoff)(handoffContext, {
                    projectId,
                    userId: user.id,
                    getThreadDetail: agentExecutionService.getThreadDetail.bind(agentExecutionService),
                });
                handoffContextBlock = resolved.block;
                agentPreviewTitleFallback = resolved.titleFallback;
                context.agentBuilderTarget = resolved.target;
                context.agentPreviewSession = {
                    agentId: handoffContext.agentId,
                    threadId: handoffContext.threadId,
                    ...(handoffContext.executionId ? { executionId: handoffContext.executionId } : {}),
                };
                await (0, instance_ai_1.saveAgentBuilderTarget)(context, resolved.target, {
                    previewSession: context.agentPreviewSession,
                });
            }
            else if (handoffContext?.source === 'setup-panel-execute' && (0, instance_ai_1.isSetupPanelEnabled)(context)) {
                handoffContextBlock = (0, internal_messages_1.buildWorkflowTestRequestBlock)(handoffContext.workflowId);
            }
            else {
                handoffContextBlock = buildHandoffContextBlock(handoffContext);
            }
            const setupStateBlock = resumeReason === undefined ? await this.buildWorkflowSetupStateBlock(context) : '';
            const thread = await memory.getThread(threadId);
            const unopenedOnboarding = thread?.metadata?.source === 'onboarding' && !thread.metadata.titleRefined;
            const isOpeningTurn = Boolean(thread && (!thread.title || unopenedOnboarding));
            const onboardingSkill = unopenedOnboarding
                ? (await this.skillsService.loadSkill(instance_ai_skills_service_1.SKILLS.suggestAutomations, skillScope)).instructions
                : undefined;
            if (isOpeningTurn) {
                const handoffTitle = unopenedOnboarding
                    ? onboarding_opening_1.ONBOARDING_OPENING.title
                    : (contextAttachments.find(isNamedResourceAttachment)?.name ?? agentPreviewTitleFallback);
                await (0, instance_ai_1.patchThread)(memory, {
                    threadId,
                    update: ({ metadata }) => handoffTitle
                        ? {
                            title: (0, instance_ai_1.truncateToTitle)(handoffTitle),
                            metadata: { ...metadata, titleRefined: true },
                        }
                        :
                            {
                                title: (0, instance_ai_1.truncateToTitle)(message) || (0, instance_ai_1.truncateToTitle)(fileAttachments[0]?.fileName ?? ''),
                            },
                });
            }
            const isMachineFollowUp = checkpoint?.isCheckpointFollowUp === true || plannedBuild?.isPlannedBuildFollowUp === true;
            const instanceContext = await this.instanceContext.buildBlock({
                user,
                scope: {
                    surface: 'conversation',
                    ...(context.projectId !== undefined ? { projectId: context.projectId } : {}),
                },
                cursor: (0, instance_context_service_1.readInstanceContextCursor)(thread?.metadata),
                isMachineFollowUp,
                enabled: instanceContextEnabled,
            });
            const contextInjection = (0, instance_context_service_1.toContextInjection)(instanceContext);
            contextTurn = {
                userId: user.id,
                threadId,
                runId,
                injection: contextInjection,
                instanceContextEnabled,
                nodeUsageEnabled,
            };
            if ((0, instance_context_service_1.shouldTraceContextInjection)(contextInjection)) {
                this.eventBus.publish(threadId, {
                    type: 'instance-context',
                    runId,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                    payload: { injection: contextInjection },
                });
            }
            const existingTasks = await taskStorage.get(threadId);
            if (existingTasks) {
                this.eventBus.publish(threadId, {
                    type: 'tasks-update',
                    runId,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                    payload: { tasks: existingTasks },
                });
            }
            let nonStructuredAttachments = [];
            let attachmentManifest = '';
            let hasParseableAttachment = false;
            if (fileAttachments.length > 0) {
                const classifiedAttachments = (0, instance_ai_1.classifyAttachments)(fileAttachments);
                nonStructuredAttachments = fileAttachments.filter((attachment) => !(0, instance_ai_1.isParseableAttachment)(attachment));
                turnHadFileAttachments = nonStructuredAttachments.length > 0;
                hasParseableAttachment = classifiedAttachments.some((attachment) => attachment.parseable);
                attachmentManifest = (0, instance_ai_1.buildAttachmentManifest)(classifiedAttachments);
            }
            const messageBody = !message && hasParseableAttachment
                ? `The user attached file(s) without a message. Inspect the first parseable attachment with parse-file and provide a concise summary.\n\n${attachmentManifest}`
                : attachmentManifest
                    ? `${enrichedMessage}\n\n${attachmentManifest}`
                    : enrichedMessage;
            let replayedHistory;
            const loadReplayedHistory = async () => await (replayedHistory ??= this.getReplayedMessages(threadId));
            const threadArtifactsBlock = resumeReason === undefined
                ? await this.resolveThreadArtifactsTurn(threadId, threadArtifacts, contextAttachments, loadReplayedHistory)
                : '';
            const [boundProject, pastConversationsSection] = await Promise.all([
                this.resolveBoundProject(context),
                isOpeningTurn ? conversationHistory?.getPastConversationsSection() : undefined,
            ]);
            const projectSection = boundProject ? (0, internal_messages_1.getProjectContextSection)(boundProject) : undefined;
            const aiPreferencesTurn = aiPreferencesEnabled && resumeReason === undefined && !isMachineFollowUp
                ? await this.resolveAiPreferencesTurn(user.id, boundProject, threadId, loadReplayedHistory)
                : undefined;
            const threadContextBlock = (0, internal_messages_1.buildThreadContextBlock)([
                instanceContext.state === 'injected' ? instanceContext.block : '',
                onboardingSkill ? (0, internal_messages_1.buildOnboardingSkillBlock)(onboardingSkill) : undefined,
                threadArtifactsBlock,
                projectSection ? (0, internal_messages_1.buildProjectContextBlock)(projectSection) : undefined,
                resumeReason === undefined
                    ? (0, internal_messages_1.buildInstanceUrlsBlock)({
                        webhookBaseUrl: this.webhookBaseUrl,
                        formBaseUrl: this.formBaseUrl,
                    })
                    : undefined,
                pastConversationsSection
                    ? (0, internal_messages_1.buildPastConversationsBlock)(pastConversationsSection)
                    : undefined,
                aiPreferencesTurn?.block,
                (0, internal_messages_1.buildCurrentDateTimeBlock)((0, instance_ai_1.getDateTimeSection)(timeZone ?? this.defaultTimeZone)),
            ]);
            const fullMessage = [handoffContextBlock, setupStateBlock, threadContextBlock, messageBody]
                .filter(Boolean)
                .join('\n\n');
            const promptBuildRun = tracing
                ? await tracing.startChildRun(tracing.messageRun, {
                    name: 'prepare: prompt',
                    canonicalName: 'instance-ai.prompt_build',
                    tags: ['prompt'],
                    metadata: { agent_role: 'prompt_build' },
                    inputs: {
                        message,
                        attachmentCount: attachments?.length ?? 0,
                    },
                })
                : undefined;
            let streamInput;
            try {
                if (nonStructuredAttachments.length > 0) {
                    const baseContent = [
                        { type: 'text', text: fullMessage },
                        ...nonStructuredAttachments.map((attachment) => ({
                            type: 'file',
                            data: attachment.data,
                            mediaType: attachment.mimeType,
                        })),
                    ];
                    streamInput = [
                        {
                            role: 'user',
                            content: baseContent,
                        },
                    ];
                }
                else {
                    streamInput = fullMessage;
                }
                if (promptBuildRun && tracing) {
                    const traceOutput = typeof streamInput === 'string'
                        ? { fullMessage: streamInput }
                        : {
                            fullMessage,
                            attachmentCount: attachments?.length ?? 0,
                            nonStructuredAttachmentCount: nonStructuredAttachments.length,
                        };
                    await tracing.finishRun(promptBuildRun, {
                        outputs: traceOutput,
                        metadata: { final_status: 'completed' },
                    });
                }
            }
            catch (error) {
                if (promptBuildRun && tracing) {
                    await tracing.failRun(promptBuildRun, error, {
                        final_status: 'error',
                    });
                }
                throw error;
            }
            if (tracing && tracing.actorRun.id === tracing.rootRun.id) {
                const actorRun = await tracing.startChildRun(tracing.rootRun, {
                    name: 'agent: orchestrator',
                    canonicalName: 'instance-ai.agent.orchestrator',
                    tags: ['orchestrator'],
                    metadata: {
                        agent_role: 'orchestrator',
                        agent_id: (0, instance_ai_1.orchestratorAgentId)(runId),
                        execution_mode: 'foreground',
                        trace_kind: tracing.traceKind,
                    },
                    inputs: traceInput,
                });
                tracing.actorRun = actorRun;
                tracing.orchestratorRun = actorRun;
            }
            const runControl = (0, instance_ai_1.createOrchestratorRunControl)(orchestrationContext);
            const stopSignal = () => runControl.getStopSignal();
            const agent = await this.createAgentFromEnvironment(environment, threadId, runId, user, tracing);
            const streamOptions = this.buildOrchestratorAgentStreamOptions(user, threadId, runId, signal);
            streamReached = true;
            if (instanceContext.state === 'injected') {
                const injectedCursor = instanceContext.cursor;
                try {
                    await (0, instance_ai_1.patchThread)(memory, {
                        threadId,
                        update: ({ metadata }) => ({
                            metadata: { ...metadata, [instance_context_service_1.INSTANCE_CONTEXT_CURSOR]: injectedCursor },
                        }),
                    });
                }
                catch (error) {
                    this.logger.warn('Failed to store the instance-context cursor', { error });
                }
            }
            if (aiPreferencesTurn) {
                this.eventBus.publish(threadId, {
                    type: 'preferences-applied',
                    runId,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                    userId: user.id,
                    payload: aiPreferencesTurn.payload,
                });
            }
            const result = tracing
                ? await tracing.withActiveSpan(tracing.actorRun, async () => {
                    return await (0, instance_ai_1.streamAgentRun)(agent, streamInput, streamOptions, {
                        threadId,
                        runId,
                        agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                        signal,
                        eventBus: contextEventBus,
                        logger: this.logger,
                        onActivity: () => this.runState.touchActiveRun(threadId),
                        stopSignal,
                    });
                })
                : await (0, instance_ai_1.streamAgentRun)(agent, streamInput, streamOptions, {
                    threadId,
                    runId,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                    signal,
                    eventBus: contextEventBus,
                    logger: this.logger,
                    onActivity: () => this.runState.touchActiveRun(threadId),
                    stopSignal,
                });
            contextResult = result;
            if (aiPreferencesTurn) {
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCES_APPLIED_TO_TURN, {
                    user_id: user.id,
                    count: aiPreferencesTurn.payload.preferences.length,
                    scope_types: [...new Set(aiPreferencesTurn.payload.preferences.map((p) => p.scope))],
                    rendered_length: aiPreferencesTurn.payload.renderedLength,
                    surface: 'aia',
                    injected_this_turn: aiPreferencesTurn.payload.injectedThisTurn,
                    turn_latency_ms: Date.now() - turnStartedAt.getTime(),
                    ...(result.usage ? { turn_token_count: result.usage.promptTokens } : {}),
                });
            }
            if (result.status === 'suspended') {
                this.emitRunMetrics(threadId, 'suspended', {
                    modelId,
                    workSummary: result.workSummary,
                    usage: result.usage,
                });
                const suspendedReach = (0, instance_ai_1.deriveInstanceContextReach)(result.workSummary?.toolCalls ?? []);
                contextSegmentReported = true;
                this.emitInstanceContextTurn(contextTurn, {
                    segment: 'suspended',
                    status: 'suspended',
                    reach: suspendedReach,
                    workSummary: result.workSummary,
                    usage: result.usage,
                });
                if (result.suspension) {
                    const suspendedContext = {
                        injection: contextInjection,
                        instanceContextEnabled,
                        nodeUsageEnabled,
                        reachSoFar: suspendedReach,
                    };
                    this.runState.suspendRun(threadId, {
                        runId,
                        agentRunId: result.agentRunId,
                        agent,
                        orchestrationContext,
                        threadId,
                        user,
                        toolCallId: result.suspension.toolCallId,
                        ...(result.suspension.toolName ? { toolName: result.suspension.toolName } : {}),
                        ...(result.suspension.suspendPayload
                            ? { suspendPayload: result.suspension.suspendPayload }
                            : {}),
                        requestId: result.suspension.requestId,
                        abortController,
                        messageGroupId,
                        createdAt: Date.now(),
                        tracing,
                        modelId,
                        checkpoint,
                        plannedBuild,
                        runHandoff: runControl.state,
                        instanceContext: suspendedContext,
                    });
                    await this.persistSuspendedInstanceContext(result.agentRunId, suspendedContext);
                    await this.suspendedThreads.persistPendingConfirmation({
                        requestId: result.suspension.requestId,
                        threadId,
                        userId: user.id,
                        runId,
                        messageGroupId,
                        kind: 'suspended',
                        toolCallId: result.suspension.toolCallId,
                        checkpointKey: result.agentRunId,
                        checkpointTaskId: checkpoint?.checkpointTaskId,
                    });
                    void this.creditService.claimRunUsage(user, threadId, `${result.agentRunId || runId}:${result.suspension.requestId}`, result.usage?.usage ?? [], 'suspended');
                }
                const intermediateText = await (result.text ?? Promise.resolve(''));
                if (intermediateText) {
                    this.telemetry.track('Builder sent message', {
                        thread_id: threadId,
                        ...(promptVersion ? { prompt_version: promptVersion } : {}),
                        message: (0, telemetry_1.redactTelemetryText)(intermediateText),
                        is_intermediate: true,
                    });
                }
                const waitingDecision = await this.terminalOutcome.evaluateWaitingResponse(threadId, runId, result.confirmationEvent, {
                    messageGroupId,
                    correlationId: messageId,
                });
                if (waitingDecision?.reason === 'confirmation-invalid') {
                    messageTraceFinalization = await this.terminalOutcome.finishInvalidConfirmationRun({
                        threadId,
                        runId,
                        promptVersion,
                        abortController,
                        tracing,
                    });
                    return;
                }
                if (signal.aborted && !this.shouldPreserveHitlOnShutdown(runId))
                    return;
                if (result.confirmationEvent) {
                    this.trackConfirmationRequest(user.id, threadId, result.confirmationEvent);
                    this.eventBus.publish(threadId, result.confirmationEvent);
                }
                const suspensionOutputs = buildSuspensionTraceOutputs(runId, result.suspension);
                await this.tracing.finalizeRunTracing(runId, tracing, {
                    status: 'suspended',
                    outputs: suspensionOutputs,
                    metadata: {
                        completion_source: 'orchestrator',
                        ...(result.suspension?.requestId ? { request_id: result.suspension.requestId } : {}),
                        ...(result.suspension?.toolCallId
                            ? { pending_tool_call_id: result.suspension.toolCallId }
                            : {}),
                        ...(result.suspension?.toolName
                            ? { pending_tool_name: result.suspension.toolName }
                            : {}),
                    },
                });
                messageTraceFinalization = {
                    status: 'suspended',
                    outputs: suspensionOutputs,
                    metadata: {
                        completion_source: 'orchestrator',
                        ...(result.suspension?.requestId ? { request_id: result.suspension.requestId } : {}),
                        ...(result.suspension?.toolCallId
                            ? { pending_tool_call_id: result.suspension.toolCallId }
                            : {}),
                        ...(result.suspension?.toolName
                            ? { pending_tool_name: result.suspension.toolName }
                            : {}),
                    },
                };
                return;
            }
            if (result.status === 'cancelled' && this.shouldPreserveHitlOnShutdown(runId)) {
                return;
            }
            if (result.status === 'cancelled') {
                const quotaAbort = quotaExhaustedFromSignal(signal);
                if (quotaAbort)
                    throw quotaAbort;
            }
            const outputText = await (result.text ?? Promise.resolve(''));
            const terminalError = result.status === 'errored'
                ? await this.reclassifyMaskedStreamFailure(result.error, user, { threadId, runId })
                : undefined;
            if (result.status === 'errored') {
                this.instanceAiErrorReporter.report(terminalError ?? new Error('Instance AI stream errored'), {
                    component: 'instance-ai-stream',
                    providerStream: true,
                    threadId,
                    runId,
                    tracing,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                    userId: user.id,
                    messageGroupId,
                    messageId,
                });
            }
            const attachmentRemoved = this.shouldDropTurnAttachments({
                turnHadAttachments: turnHadFileAttachments,
                producedNoOutput: result.status === 'errored' && outputText.length === 0,
            })
                ? await this.dropTurnAttachments({ threadId, resourceId: user.id })
                : undefined;
            const userFacingErrorMessage = result.status === 'errored'
                ? getUserFacingErrorMessage(terminalError, undefined, { attachmentRemoved })
                : undefined;
            const userFacingErrorCode = result.status === 'errored' ? getUserFacingErrorCode(terminalError) : undefined;
            if (runControl.shouldEmitTerminalOutcome(result.stopReason)) {
                await this.terminalOutcome.evaluateTerminalResponse(threadId, runId, result.status, {
                    messageGroupId,
                    correlationId: messageId,
                    workSummary: result.workSummary,
                    errorMessage: userFacingErrorMessage,
                    errorCode: userFacingErrorCode,
                    suppressCompletedFallback: checkpoint?.isCheckpointFollowUp === true ||
                        plannedBuild?.isPlannedBuildFollowUp === true,
                });
            }
            const finalStatus = result.status === 'errored' ? 'error' : result.status;
            await this.tracing.finalizeRunTracing(runId, tracing, {
                status: finalStatus,
                outputText,
                modelId,
            });
            messageTraceFinalization = {
                status: finalStatus,
                outputText,
                modelId,
                metadata: await this.tracing.buildMessageTraceMetadata(threadId, runId, {
                    status: finalStatus,
                }),
            };
            const archivedWorkflowIds = await this.temporaryWorkflowService.reapForRun(threadId, user, aiCreatedWorkflowIds, this.backgroundTasks.getRunningTasks(threadId).length);
            const contextReach = (0, instance_ai_1.deriveInstanceContextReach)(result.workSummary?.toolCalls ?? []);
            contextSegmentReported = true;
            this.emitInstanceContextTurn(contextTurn, {
                segment: 'whole',
                status: result.status,
                reach: contextReach,
                workSummary: result.workSummary,
                usage: result.usage,
            });
            await this.finalizeRun(threadId, runId, result.status, {
                promptVersion,
                userId: user.id,
                modelId,
                archivedWorkflowIds,
                workSummary: result.workSummary,
                usage: result.usage,
                contextReach,
                errorReason: userFacingErrorMessage,
                ...(result.status === 'errored'
                    ? {
                        errorInfo: {
                            errorMessage: terminalError
                                ? (0, get_error_message_1.getErrorMessage)(terminalError)
                                : 'Instance AI stream errored',
                            errorSource: 'stream',
                        },
                    }
                    : {}),
            });
            await this.creditService.claimRunUsage(user, threadId, result.agentRunId || runId, result.usage?.usage ?? [], result.status);
            if (result.status === 'completed') {
                this.telemetry.track('Builder sent message', {
                    thread_id: threadId,
                    ...(promptVersion ? { prompt_version: promptVersion } : {}),
                    message: (0, telemetry_1.redactTelemetryText)(outputText),
                });
                this.telemetry.track('Builder satisfied user intent', {
                    thread_id: threadId,
                    ...(promptVersion ? { prompt_version: promptVersion } : {}),
                });
            }
        }
        catch (error) {
            const quotaAbort = quotaExhaustedFromSignal(signal) ?? asQuotaExhaustedError(error);
            if (quotaAbort)
                blockedForQuota = true;
            if (signal.aborted && !quotaAbort && this.shouldPreserveHitlOnShutdown(runId))
                return;
            const contextWork = contextResult
                ? contextResult.workSummary
                : observedContextWork.toSummary();
            const contextReach = contextTurn
                ? (0, instance_ai_1.deriveInstanceContextReach)(contextWork?.toolCalls ?? [])
                : undefined;
            if (contextTurn && contextReach && !contextSegmentReported) {
                contextSegmentReported = true;
                this.emitInstanceContextTurn(contextTurn, {
                    segment: 'whole',
                    status: signal.aborted && !quotaAbort ? 'cancelled' : 'errored',
                    reach: contextReach,
                    workSummary: contextWork,
                    usage: contextResult?.usage,
                });
            }
            if (signal.aborted && !quotaAbort) {
                if (!streamReached) {
                    await this.persistInterruptedUserMessage(threadId, user.id, message, turnStartedAt);
                }
                const runTimeout = this.liveness.consumeRunTimeout(runId);
                const cancellationReason = runTimeout.timedOut
                    ? liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON
                    : getAbortReason(signal);
                if (cancellationReason === liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON) {
                    this.liveness.publishRunTimeoutNotice(threadId, runId);
                }
                await this.terminalOutcome.evaluateTerminalResponse(threadId, runId, 'cancelled', {
                    messageGroupId,
                    correlationId: messageId,
                });
                await this.tracing.finalizeRunTracing(runId, tracing, {
                    status: 'cancelled',
                    reason: cancellationReason,
                });
                messageTraceFinalization = {
                    status: 'cancelled',
                    reason: cancellationReason,
                    metadata: await this.tracing.buildMessageTraceMetadata(threadId, runId, {
                        status: 'cancelled',
                        cancellationReason,
                        runTimeout,
                    }),
                };
                const archivedWorkflowIds = await this.temporaryWorkflowService.reapForRun(threadId, user, aiCreatedWorkflowIds, this.backgroundTasks.getRunningTasks(threadId).length);
                this.publishRunFinish(threadId, runId, 'cancelled', cancellationReason, archivedWorkflowIds, user.id, { promptVersion, contextReach, ...(modelId !== undefined ? { modelId } : {}) });
                return;
            }
            const terminalError = quotaAbort ??
                (await this.reclassifyMaskedStreamFailure(error, user, {
                    threadId,
                    runId,
                }));
            const attachmentRemoved = this.shouldDropTurnAttachments({
                turnHadAttachments: turnHadFileAttachments,
                producedNoOutput: true,
            })
                ? await this.dropTurnAttachments({ threadId, resourceId: user.id })
                : undefined;
            const errorMessage = (0, get_error_message_1.getErrorMessage)(terminalError);
            const userFacingErrorMessage = getUserFacingErrorMessage(terminalError, undefined, {
                attachmentRemoved,
            });
            const userFacingErrorCode = getUserFacingErrorCode(terminalError);
            const errCtx = {
                threadId,
                runId,
                tracing,
                agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                userId: user.id,
                messageGroupId,
                messageId,
            };
            this.logger.error(`Instance AI run error: ${errorMessage}`, {
                error: errorMessage,
                ...(0, observability_1.buildInstanceAiObservabilityContext)(errCtx),
            });
            this.instanceAiErrorReporter.report(terminalError, {
                component: 'instance-ai-run',
                ...errCtx,
            });
            await this.terminalOutcome.evaluateTerminalResponse(threadId, runId, 'errored', {
                messageGroupId,
                correlationId: messageId,
                errorMessage: userFacingErrorMessage,
                errorCode: userFacingErrorCode,
            });
            await this.tracing.finalizeRunTracing(runId, tracing, {
                status: 'error',
                reason: errorMessage,
            });
            messageTraceFinalization = {
                status: 'error',
                reason: errorMessage,
                metadata: await this.tracing.buildMessageTraceMetadata(threadId, runId, {
                    status: 'error',
                }),
            };
            const archivedWorkflowIds = await this.temporaryWorkflowService.reapForRun(threadId, user, aiCreatedWorkflowIds, this.backgroundTasks.getRunningTasks(threadId).length);
            this.publishRunFinish(threadId, runId, 'errored', userFacingErrorMessage, archivedWorkflowIds, user.id, {
                errorMessage,
                errorSource: 'exception',
                promptVersion,
                contextReach,
                ...(modelId !== undefined ? { modelId } : {}),
            });
        }
        finally {
            this.runState.clearActiveRun(threadId);
            const segmentSuspended = messageTraceFinalization?.status === 'suspended';
            this.domainAccessTrackersByThread.get(threadId)?.clearRun(runId);
            if (messageTraceFinalization) {
                if (tracing) {
                    await this.tracing.finalizeMessageTraceRoot(runId, tracing, messageTraceFinalization);
                }
                if (messageTraceFinalization.status !== 'cancelled' && !segmentSuspended) {
                    this.liveness.consumeRunTimeout(runId);
                }
            }
            this.updateInternalFollowUpFailureStreak(threadId, messageTraceFinalization?.status, resumeReason !== undefined);
            if (!segmentSuspended && !this.runState.hasSuspendedRun(threadId)) {
                const reschedule = !signal.aborted && !blockedForQuota;
                if (checkpoint?.isCheckpointFollowUp) {
                    await this.finalizeCheckpointFollowUp(user, threadId, checkpoint.checkpointTaskId, {
                        reschedule,
                    });
                }
                else if (plannedBuild?.isPlannedBuildFollowUp) {
                    await this.finalizePlannedBuildFollowUp(user, threadId, plannedBuild, { reschedule });
                }
                else if (reschedule) {
                    await this.schedulePlannedTasks(user, threadId);
                }
                await this.taskProjector.syncFromWorkflowLoop(threadId, runId);
                if (reschedule) {
                    await this.maybeStartWorkflowSetupFollowUp(user, threadId);
                }
            }
            if (errorReporterExecutionToken) {
                this.instanceAiErrorReporter.endRun(runId, errorReporterExecutionToken);
            }
        }
    }
    async finalizeCheckpointFollowUp(user, threadId, checkpointTaskId, { reschedule = true } = {}) {
        try {
            const { plannedTaskService } = await this.createPlannedTaskState();
            const graph = await plannedTaskService.getGraph(threadId);
            const task = graph?.tasks.find((t) => t.id === checkpointTaskId);
            if (task && task.status === 'running') {
                const inflightChildren = this.backgroundTasks.getRunningTasksByParentCheckpoint(threadId, checkpointTaskId);
                if (inflightChildren.length > 0) {
                    this.logger.debug('Checkpoint run ended with in-flight child tasks — deferring finalization', {
                        threadId,
                        checkpointTaskId,
                        inflightTaskIds: inflightChildren.map((t) => t.taskId),
                    });
                }
                else {
                    this.logger.warn('Checkpoint run ended without reporting completion — marking failed', {
                        threadId,
                        checkpointTaskId,
                    });
                    await plannedTaskService.markCheckpointFailed(threadId, checkpointTaskId, {
                        error: 'Checkpoint run ended without reporting completion',
                    });
                    const nextGraph = await plannedTaskService.getGraph(threadId);
                    if (nextGraph) {
                        await this.syncPlannedTasksToUi(threadId, nextGraph);
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Checkpoint finalization failed', {
                threadId,
                checkpointTaskId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        if (!reschedule)
            return;
        await this.schedulePlannedTasks(user, threadId);
    }
    async finalizePlannedBuildFollowUp(user, threadId, plannedBuild, { reschedule = true } = {}) {
        try {
            const { plannedTaskService } = await this.createPlannedTaskState();
            const graph = await plannedTaskService.getGraph(threadId);
            const task = graph?.tasks.find((t) => t.id === plannedBuild.buildTaskId);
            if (task && task.status === 'running') {
                if (plannedBuild.savedOutcome?.submitted === true) {
                    await plannedTaskService.markSucceeded(threadId, plannedBuild.buildTaskId, {
                        result: plannedBuild.savedOutcome.summary,
                        outcome: plannedBuild.savedOutcome,
                    });
                }
                else {
                    this.logger.warn('Build workflow follow-up ended without saving — marking failed', {
                        threadId,
                        buildTaskId: plannedBuild.buildTaskId,
                    });
                    await plannedTaskService.markFailed(threadId, plannedBuild.buildTaskId, {
                        error: 'Workflow build run ended without saving a workflow',
                    });
                }
                const nextGraph = await plannedTaskService.getGraph(threadId);
                if (nextGraph) {
                    await this.syncPlannedTasksToUi(threadId, nextGraph);
                }
            }
        }
        catch (error) {
            this.logger.error('Build workflow finalization failed', {
                threadId,
                buildTaskId: plannedBuild.buildTaskId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        if (!reschedule)
            return;
        await this.schedulePlannedTasks(user, threadId);
    }
    async resolveConfirmation(requestingUserId, requestId, request) {
        const data = (0, confirmation_payload_1.toConfirmationData)(request);
        const freshUser = await this.revalidateActiveUser(requestingUserId);
        if (!freshUser) {
            this.runState.rejectPendingConfirmation(requestId);
            const suspended = this.runState.findSuspendedByRequestId(requestId);
            if (suspended?.user.id === requestingUserId) {
                this.cancelRun(suspended.threadId);
            }
            this.logger.warn('Rejecting confirmation: user no longer authorized for n8n Assistant', {
                userId: requestingUserId,
                requestId,
            });
            return null;
        }
        if (await this.pendingConfirmationRepo.isPastExpiry(requestId, freshUser.id, new Date())) {
            this.logger.debug('Rejecting expired confirmation', { requestId });
            throw new n8n_workflow_1.UserError(CONFIRMATION_EXPIRED_MESSAGE);
        }
        const pending = this.runState.getPendingConfirmation(requestId);
        if (pending &&
            pending.userId === freshUser.id &&
            this.runState.resolvePendingConfirmation(freshUser.id, requestId, data)) {
            void this.suspendedThreads.dropPendingConfirmation(requestId);
            this.logger.debug('Resolved pending confirmation (sub-agent HITL)', {
                requestId,
                approved: data.approved,
            });
            const runId = this.runState.getActiveRunId(pending.threadId);
            return {
                ok: true,
                ...(runId ? { runId } : {}),
            };
        }
        this.logger.debug('Pending confirmation not found, trying suspended run resume', {
            requestId,
            approved: data.approved,
        });
        const resumed = await this.resumeSuspendedRun(requestingUserId, requestId, data);
        if (resumed) {
            return resumed;
        }
        return await this.suspendedRunRestorer.resolveOrphanedConfirmation(requestingUserId, requestId, data);
    }
    async buildMcpServers(user, threadId, runId, tracing, messageGroupId) {
        const staticMcpServers = this.parseMcpServers(this.instanceAiConfig.mcpServers);
        const registryMcpServers = this.settingsService.isMcpAccessEnabled()
            ? await this.instanceAiErrorReporter.withBoundary('instance-ai-mcp-setup', {
                threadId,
                runId,
                tracing,
                agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                userId: user.id,
                messageGroupId,
            }, async () => await this.mcpRegistryService.getRegistryMcpServers(user))
            : [];
        return [...staticMcpServers, ...registryMcpServers];
    }
    async createAgentFromEnvironment(environment, threadId, runId, user, tracing) {
        if (tracing) {
            environment.orchestrationContext.tracing = tracing;
        }
        await this.bindAgentContextReader(environment.context, user);
        await this.bindAgentPreviewSession(environment.context, user);
        const mcpServers = await this.buildMcpServers(user, threadId, runId, tracing, environment.orchestrationContext.messageGroupId);
        const { agent, mcpConnectionFailures } = await (0, instance_ai_1.createInstanceAgent)({
            modelId: environment.modelId,
            context: environment.context,
            orchestrationContext: environment.orchestrationContext,
            mcpServers,
            mcpManager: this.mcpClientManager,
            memoryConfig: this.createAgentMemoryOptions(user, threadId, runId, environment.memoryModelId),
            memory: environment.memory,
            checkpointStore: this.checkpointStore,
            onMemoryTaskEvent: this.memoryTaskObserverFor(threadId, tracing),
            thinkingEnabled: this.instanceAiConfig.thinkingEnabled,
        });
        if (mcpConnectionFailures.length > 0) {
            const names = mcpConnectionFailures.map((f) => f.server).join(', ');
            for (const failure of mcpConnectionFailures) {
                this.errorReporter.error(new Error(`MCP server "${failure.server}" failed to connect: ${failure.error}`), {
                    level: 'warning',
                    tags: { component: 'instance-ai-mcp', server: failure.server },
                    extra: { runId, threadId, server: failure.server, error: failure.error },
                    shouldIsolate: true,
                });
            }
            this.eventBus.publish(threadId, {
                type: 'status',
                runId,
                agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
                payload: {
                    message: `Couldn't reach MCP server${mcpConnectionFailures.length > 1 ? 's' : ''} ${names}; continuing without their tools.`,
                },
            });
        }
        this.subscribeToAgentErrors(agent, threadId, runId);
        return agent;
    }
    async buildFreshInstanceAgent(user, threadId, runId, abortSignal, tracing, messageGroupId, pushRef, instanceContextGates) {
        const environment = await this.createExecutionEnvironment(user, threadId, runId, abortSignal, messageGroupId, pushRef, undefined, instanceContextGates);
        const agent = await this.createAgentFromEnvironment(environment, threadId, runId, user, tracing);
        return {
            agent,
            modelId: environment.modelId,
            orchestrationContext: environment.orchestrationContext,
        };
    }
    async rebuildSuspendedRunFromCheckpoint(orphan) {
        const user = await this.revalidateActiveUser(orphan.userId);
        if (!user)
            return { kind: 'no-user' };
        let instanceContext;
        let toolName;
        let suspendPayload;
        try {
            const state = await this.checkpointStore.load(orphan.checkpointKey);
            if (!state)
                return { kind: 'no-checkpoint' };
            const pendingToolCall = state.pendingToolCalls?.[orphan.toolCallId];
            if (pendingToolCall?.suspended) {
                toolName = pendingToolCall.toolName;
                suspendPayload = (0, is_record_1.isRecord)(pendingToolCall.suspendPayload)
                    ? pendingToolCall.suspendPayload
                    : undefined;
            }
            const storedContext = instance_ai_1.suspendedInstanceContextSchema.safeParse(state.persistence?.hostMetadata?.instanceContext);
            if (storedContext.success)
                instanceContext = storedContext.data;
            const mode = api_types_1.instanceAiBuildModeSchema.safeParse(state.persistence?.hostMetadata?.buildMode);
            this.runState.setBuildMode(orphan.threadId, mode.success ? mode.data : 'default');
            const version = state.persistence?.hostMetadata?.promptVersion;
            this.runState.setPromptVersion(orphan.threadId, typeof version === 'string' ? version : undefined);
        }
        catch (error) {
            return { kind: 'no-checkpoint', error };
        }
        const abortController = new AbortController();
        let environment;
        try {
            environment = await this.createExecutionEnvironment(user, orphan.threadId, orphan.runId, abortController.signal, orphan.messageGroupId ?? undefined, this.threadPushRef.get(orphan.threadId), undefined, instanceContext);
        }
        catch (error) {
            return { kind: 'env-failure', error };
        }
        const runControl = (0, instance_ai_1.createOrchestratorRunControl)(environment.orchestrationContext);
        let agent;
        try {
            agent = await this.createAgentFromEnvironment(environment, orphan.threadId, orphan.runId, user, undefined);
        }
        catch (error) {
            return { kind: 'agent-failure', error };
        }
        return {
            kind: 'ready',
            state: {
                runId: orphan.runId,
                agentRunId: orphan.checkpointKey,
                instanceContext,
                agent,
                orchestrationContext: environment.orchestrationContext,
                threadId: orphan.threadId,
                user,
                toolCallId: orphan.toolCallId,
                toolName,
                suspendPayload,
                requestId: orphan.requestId,
                abortController,
                messageGroupId: orphan.messageGroupId ?? undefined,
                createdAt: Date.now(),
                tracing: undefined,
                modelId: environment.modelId,
                checkpoint: orphan.checkpointTaskId
                    ? { isCheckpointFollowUp: true, checkpointTaskId: orphan.checkpointTaskId }
                    : undefined,
                runHandoff: runControl.state,
            },
        };
    }
    async revalidateActiveUser(userId) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['role'],
            });
            if (!user || user.disabled)
                return null;
            const hasInstanceAiMessageScope = user.role?.scopes?.some((scope) => scope.slug === 'instanceAi:message') ?? false;
            return hasInstanceAiMessageScope ? user : null;
        }
        catch (error) {
            this.logger.warn('Failed to revalidate user', {
                userId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return null;
        }
    }
    async resolveBoundProject(context) {
        const projectId = context.projectId;
        if (!projectId)
            return undefined;
        try {
            const project = await context.workspaceService?.getProject?.(projectId);
            if (project)
                return project;
            this.logger.warn('Instance AI could not name the bound project for this turn', {
                projectId,
                reason: context.workspaceService?.getProject ? 'not-readable' : 'no-workspace-adapter',
            });
            return undefined;
        }
        catch (error) {
            this.logger.warn('Instance AI failed to resolve the bound project for this turn', {
                projectId,
                error: error instanceof Error ? error.message : String(error),
            });
            this.errorReporter.error(error, {
                level: 'warning',
                tags: { component: 'instance-ai-project-context' },
                extra: { projectId },
                shouldIsolate: true,
            });
            return undefined;
        }
    }
    async resolveAiPreferencesTurn(userId, project, threadId, loadHistory = async () => await this.getReplayedMessages(threadId)) {
        const resolved = await this.bestEffort('Instance AI failed to read the AI preferences for this turn', { userId }, async () => {
            const preferences = await this.aiPreferenceService.getApplicable(userId, project ? [project] : []);
            return { preferences, rendered: (0, ai_preference_service_1.renderAiPreferencesBlock)(preferences) };
        });
        if (!resolved) {
            return {
                block: undefined,
                payload: { preferences: [], renderedLength: 0, injectedThisTurn: false },
            };
        }
        const history = await this.bestEffort('Instance AI failed to read the last AI preferences block of this thread', { threadId }, async () => await this.findAiPreferencesHistory(loadHistory));
        const lastBlock = history?.block;
        const savedSinceLastBlock = history?.savedSinceLastBlock === true;
        const { preferences, rendered } = resolved;
        const freshBlock = rendered ??
            (lastBlock !== undefined || savedSinceLastBlock ? ai_preference_service_1.AI_PREFERENCES_CLEARED_BLOCK : undefined);
        if (freshBlock === undefined) {
            return {
                block: undefined,
                payload: (0, ai_preference_service_1.buildAppliedPreferencesPayload)({
                    preferences,
                    renderedLength: 0,
                    injectedThisTurn: false,
                }),
            };
        }
        if (!savedSinceLastBlock &&
            lastBlock !== undefined &&
            (0, internal_messages_1.asStoredThreadContextSection)(freshBlock) === lastBlock) {
            const carriedFromRunId = await this.bestEffort('Instance AI failed to resolve which run sent the AI preferences block', { threadId }, async () => await this.eventLog.getLastPreferencesInjectionRunId(threadId));
            return {
                block: undefined,
                payload: (0, ai_preference_service_1.buildAppliedPreferencesPayload)({
                    preferences,
                    renderedLength: freshBlock.length,
                    injectedThisTurn: false,
                    ...(carriedFromRunId ? { carriedFromRunId } : {}),
                }),
            };
        }
        return {
            block: freshBlock,
            payload: (0, ai_preference_service_1.buildAppliedPreferencesPayload)({
                preferences,
                renderedLength: freshBlock.length,
                injectedThisTurn: true,
            }),
        };
    }
    async findAiPreferencesHistory(loadHistory) {
        const history = await loadHistory();
        let savedSinceLastBlock = false;
        for (let i = history.length - 1; i >= 0; i--) {
            const m = history[i];
            if (!('role' in m))
                continue;
            if (m.role === 'assistant' && Array.isArray(m.content)) {
                savedSinceLastBlock ||= m.content.some((part) => part.type === 'tool-call' &&
                    part.toolName === 'save_user_preference' &&
                    part.state === 'resolved' &&
                    (0, is_record_1.isRecord)(part.output) &&
                    part.output.ok === true);
            }
            if (m.role !== 'user')
                continue;
            const block = (0, internal_messages_1.extractAiPreferencesBlock)(this.extractStoredMessageText(m.content));
            if (block !== undefined)
                return { block, savedSinceLastBlock };
        }
        return { savedSinceLastBlock };
    }
    async resolveThreadArtifactsTurn(threadId, context, attachments, loadHistory) {
        const freshBlock = (0, internal_messages_1.buildThreadArtifactsBlock)(context, attachments);
        if (!freshBlock)
            return '';
        if (attachments.length > 0)
            return freshBlock;
        const history = await this.bestEffort('Instance AI failed to read the last thread artifacts block of this thread', { threadId }, async () => ({ block: await this.findLastThreadArtifactsBlock(loadHistory) }));
        if (!history)
            return freshBlock;
        return (0, internal_messages_1.asStoredThreadContextSection)(freshBlock) === history.block ? '' : freshBlock;
    }
    async findLastThreadArtifactsBlock(loadHistory) {
        const history = await loadHistory();
        for (let i = history.length - 1; i >= 0; i--) {
            const m = history[i];
            if (!('role' in m) || m.role !== 'user')
                continue;
            const block = (0, internal_messages_1.extractThreadArtifactsBlock)(this.extractStoredMessageText(m.content));
            if (block !== undefined)
                return block;
        }
        return undefined;
    }
    async getReplayedMessages(threadId) {
        const cursor = await this.agentMemory.getCursor(threadId);
        if (cursor) {
            const observations = await this.agentMemory.getActiveObservationLog({
                observationScopeId: threadId,
                limit: 1,
                order: 'desc',
            });
            if (observations.length > 0) {
                return await this.agentMemory.getMessagesForObservationScope(threadId, {
                    since: {
                        sinceCreatedAt: cursor.lastObservedAt,
                        sinceMessageId: cursor.lastObservedMessageId,
                    },
                });
            }
        }
        return await this.agentMemory.getMessages(threadId);
    }
    async canAccessAgentPreviewHandoff(user, projectId) {
        const requiredScopes = ['agent:read', 'agent:update'];
        return await (0, check_access_1.userHasScopes)(user, requiredScopes, false, { projectId });
    }
    async assertAgentPreviewHandoffScopes(user, projectId) {
        if (!(await this.canAccessAgentPreviewHandoff(user, projectId))) {
            throw new errors_1.ForbiddenError('You do not have permission to load or edit agent previews in this project.');
        }
    }
    async rebuildAgentForResume(user, threadId, runId, abortController, tracing, runHandoff, messageGroupId, instanceContextGates) {
        try {
            const rebuilt = await this.buildFreshInstanceAgent(user, threadId, runId, abortController.signal, tracing, messageGroupId, this.threadPushRef.get(threadId), instanceContextGates);
            (0, instance_ai_1.createOrchestratorRunControl)(rebuilt.orchestrationContext, runHandoff ?? {});
            return {
                agent: rebuilt.agent,
                modelId: rebuilt.modelId,
                orchestrationContext: rebuilt.orchestrationContext,
            };
        }
        catch (error) {
            this.logger.warn('Failed to rebuild agent for resume', {
                threadId,
                runId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return undefined;
        }
    }
    async resumeSuspendedRun(requestingUserId, requestId, data) {
        const suspended = this.runState.findSuspendedByRequestId(requestId);
        if (!suspended) {
            this.logger.warn('Confirmation target not found: no pending confirmation or suspended run', {
                requestId,
                approved: data.approved,
            });
            return null;
        }
        const { agent, runId, agentRunId, threadId, user, toolCallId, toolName, suspendPayload, abortController, tracing, modelId, messageGroupId, checkpoint, plannedBuild, runHandoff, orchestrationContext, instanceContext, } = suspended;
        if (user.id !== requestingUserId)
            return null;
        const activeRun = this.runState.getActiveRun(threadId);
        if (activeRun) {
            this.logger.warn('Rejecting suspended-run confirmation: thread already has an active run', {
                requestId,
                threadId,
                suspendedRunId: runId,
                activeRunId: activeRun.runId,
            });
            return null;
        }
        const activeUser = await this.revalidateActiveUser(user.id);
        if (!activeUser) {
            this.logger.warn('Cancelling suspended run: user no longer authorized for n8n Assistant', {
                userId: user.id,
                threadId,
                requestId,
            });
            this.cancelRun(threadId);
            return null;
        }
        const resumeExecutionToken = Symbol('instance-ai-resume-execution');
        if (!this.runState.activateSuspendedRun(threadId, resumeExecutionToken)) {
            return { ok: true, runId };
        }
        void this.suspendedThreads.dropPendingConfirmation(requestId);
        const resumeData = (0, confirmation_payload_1.buildResumeData)(data);
        const resumeTracing = await this.tracing.createOrchestratorResumeTraceContext({
            baseTracing: tracing,
            threadId,
            messageId: (0, nanoid_1.nanoid)(),
            messageGroupId,
            runId,
            userId: activeUser.id,
            modelId,
            input: {
                requestId,
                toolCallId,
                approved: data.approved,
                resumeFields: Object.keys(resumeData),
                ...(data.userInput ? { userInput: data.userInput } : {}),
                ...(data.action ? { action: data.action } : {}),
                ...(data.resourceDecision ? { resourceDecision: data.resourceDecision } : {}),
                ...(data.answers ? { answers: data.answers } : {}),
            },
            resumeReason: 'approval',
            metadata: {
                ...(await this.readThreadProvenance(activeUser.id, threadId)),
                request_id: requestId,
                pending_tool_call_id: toolCallId,
                approved: data.approved,
                ...(checkpoint?.isCheckpointFollowUp
                    ? { checkpoint_task_id: checkpoint.checkpointTaskId }
                    : {}),
                ...(plannedBuild?.isPlannedBuildFollowUp
                    ? { build_task_id: plannedBuild.buildTaskId }
                    : {}),
            },
            browserExtension: this.browserSessionService.getExtensionTraceContext(activeUser.id),
            register: false,
        });
        const effectiveTracing = resumeTracing ?? tracing;
        const unregisteredResumeTracing = resumeTracing && resumeTracing !== tracing ? resumeTracing : undefined;
        let resumeAgent = agent;
        let resumeModelId = modelId;
        let resumeOrchestrationContext = orchestrationContext;
        if (data.autoSetup || data.connectedSlugs?.length) {
            const rebuilt = await this.rebuildAgentForResume(activeUser, threadId, runId, abortController, effectiveTracing, runHandoff, messageGroupId, instanceContext);
            if (!rebuilt) {
                const rebuildFailure = 'Agent rebuild failed';
                await this.tracing.finalizeDetachedTraceRun(`resume-rebuild:${runId}`, unregisteredResumeTracing, {
                    status: 'failed',
                    error: rebuildFailure,
                    metadata: { completion_source: 'resume_rebuild' },
                });
                this.cancelRun(threadId, 'agent_rebuild_failed');
                await this.emitTerminalRun({
                    threadId,
                    runId,
                    status: 'errored',
                    reason: OPERATIONAL_ERROR_USER_MESSAGE,
                    errorInfo: { errorMessage: rebuildFailure, errorSource: 'exception' },
                    messageGroupId,
                    user: activeUser,
                    ...(modelId !== undefined ? { modelId } : {}),
                });
                this.runState.clearActiveRun(threadId, resumeExecutionToken);
                return null;
            }
            resumeAgent = rebuilt.agent;
            resumeModelId = rebuilt.modelId;
            if (orchestrationContext) {
                (0, instance_ai_1.carryAgentBuildRunState)(orchestrationContext, rebuilt.orchestrationContext);
            }
            resumeOrchestrationContext = rebuilt.orchestrationContext;
        }
        this.startProcessResumedStream(resumeAgent, resumeData, {
            runId,
            agentRunId,
            threadId,
            user: activeUser,
            toolCallId,
            toolName,
            suspendPayload,
            signal: abortController.signal,
            abortController,
            tracing: effectiveTracing,
            orchestrationContext: resumeOrchestrationContext,
            modelId: resumeModelId,
            checkpoint,
            plannedBuild,
            runHandoff,
            resumeExecutionToken,
            messageGroupId,
            resumeTracing,
            unregisteredResumeTracing,
            instanceContext,
        });
        return { ok: true, runId };
    }
    async processResumedStream(agent, resumeData, opts) {
        let messageTraceFinalization;
        const promptVersion = opts.orchestrationContext?.promptConfiguration?.version ??
            this.runState.getPromptConfiguration(opts.threadId)?.version;
        (0, instance_ai_1.setTracePromptVersion)(opts.tracing, promptVersion);
        (0, instance_ai_1.setTraceModelId)(opts.tracing, opts.modelId);
        let completedSetupWorkflowId;
        let skipPostRunCleanup = false;
        let resumeClaimed = false;
        let resumeTraceRegistered = false;
        let errorReporterExecutionToken;
        const contextTurn = this.instanceContextTurnBinding(opts);
        let contextResult;
        let contextSegmentReported = false;
        let blockedForQuota = false;
        const observedContextWork = new instance_ai_1.WorkSummaryAccumulator();
        const contextEventBus = this.observeInstanceContextEvents(observedContextWork);
        let resumedRunProducedOutput = false;
        const onResumeClaimed = async () => {
            if (resumeClaimed)
                return;
            resumeClaimed = true;
            if (opts.resumeTracing && !resumeTraceRegistered) {
                this.tracing.registerTraceContext(opts.runId, opts.threadId, opts.resumeTracing, opts.messageGroupId);
                resumeTraceRegistered = true;
            }
            if (opts.orchestrationContext && opts.tracing) {
                opts.orchestrationContext.tracing = opts.tracing;
            }
            errorReporterExecutionToken = this.instanceAiErrorReporter.beginRun(opts.runId);
        };
        try {
            if (opts.tracing?.getTelemetry && isTelemetryConfigurableAgent(agent)) {
                try {
                    agent.telemetry(opts.tracing.getTelemetry({
                        agentRole: 'orchestrator',
                        functionId: 'instance-ai.orchestrator',
                        executionMode: opts.tracing.traceKind === 'orchestrator_resume' ? 'resume' : 'foreground',
                    }));
                }
                catch (error) {
                    this.logger.warn('Failed to configure Instance AI resume tracing', {
                        error: (0, get_error_message_1.getErrorMessage)(error),
                        threadId: opts.threadId,
                        runId: opts.runId,
                    });
                }
            }
            const resumeOptions = {
                ...this.buildOrchestratorResumeAgentOptions(opts.user, opts.threadId, opts.runId, opts.agentRunId, opts.toolCallId, opts.signal),
                onResumeClaimed,
            };
            const runControl = (0, instance_ai_1.createOrchestratorRunControlForState)(opts.runHandoff);
            const stopSignal = () => runControl.getStopSignal();
            const result = opts.tracing
                ? await opts.tracing.withActiveSpan(opts.tracing.actorRun, async () => {
                    return await (0, instance_ai_1.resumeAgentRun)(agent, resumeData, resumeOptions, {
                        threadId: opts.threadId,
                        runId: opts.runId,
                        agentId: (0, instance_ai_1.orchestratorAgentId)(opts.runId),
                        signal: opts.signal,
                        eventBus: contextEventBus,
                        logger: this.logger,
                        agentRunId: opts.agentRunId,
                        onActivity: () => this.runState.touchActiveRun(opts.threadId),
                        stopSignal,
                    });
                })
                : await (0, instance_ai_1.resumeAgentRun)(agent, resumeData, resumeOptions, {
                    threadId: opts.threadId,
                    runId: opts.runId,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(opts.runId),
                    signal: opts.signal,
                    eventBus: contextEventBus,
                    logger: this.logger,
                    agentRunId: opts.agentRunId,
                    onActivity: () => this.runState.touchActiveRun(opts.threadId),
                    stopSignal,
                });
            contextResult = result;
            if (!resumeClaimed) {
                skipPostRunCleanup = true;
                const claimError = result.error ?? new Error('Resume checkpoint claim did not complete');
                await this.settleUnclaimedResume(opts, claimError, 'stream', promptVersion);
                return;
            }
            if (result.status === 'suspended') {
                this.emitRunMetrics(opts.threadId, 'suspended', {
                    modelId: opts.modelId,
                    workSummary: result.workSummary,
                    usage: result.usage,
                });
                const resumedSegmentReach = (0, instance_ai_1.deriveInstanceContextReach)(result.workSummary?.toolCalls ?? []);
                const resumedSuspendedReach = (0, instance_ai_1.mergeInstanceContextReach)(opts.instanceContext?.reachSoFar, resumedSegmentReach);
                if (contextTurn) {
                    contextSegmentReported = true;
                    this.emitInstanceContextTurn(contextTurn, {
                        segment: 'suspended',
                        status: 'suspended',
                        reach: resumedSegmentReach,
                        workSummary: result.workSummary,
                        usage: result.usage,
                    });
                }
                if (result.suspension) {
                    const resumeMessageGroupId = this.tracing.getMessageGroupId(opts.runId);
                    const suspendedContext = opts.instanceContext
                        ? { ...opts.instanceContext, reachSoFar: resumedSuspendedReach }
                        : undefined;
                    this.runState.suspendRun(opts.threadId, {
                        runId: opts.runId,
                        agentRunId: result.agentRunId,
                        agent,
                        orchestrationContext: opts.orchestrationContext,
                        threadId: opts.threadId,
                        user: opts.user,
                        toolCallId: result.suspension.toolCallId,
                        ...(result.suspension.toolName ? { toolName: result.suspension.toolName } : {}),
                        ...(result.suspension.suspendPayload
                            ? { suspendPayload: result.suspension.suspendPayload }
                            : {}),
                        requestId: result.suspension.requestId,
                        abortController: opts.abortController,
                        messageGroupId: resumeMessageGroupId,
                        createdAt: Date.now(),
                        tracing: opts.tracing,
                        ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
                        checkpoint: opts.checkpoint,
                        plannedBuild: opts.plannedBuild,
                        runHandoff: runControl.state,
                        instanceContext: suspendedContext,
                    });
                    await this.persistSuspendedInstanceContext(result.agentRunId, suspendedContext);
                    await this.suspendedThreads.persistPendingConfirmation({
                        requestId: result.suspension.requestId,
                        threadId: opts.threadId,
                        userId: opts.user.id,
                        runId: opts.runId,
                        messageGroupId: resumeMessageGroupId,
                        kind: 'suspended',
                        toolCallId: result.suspension.toolCallId,
                        checkpointKey: result.agentRunId,
                        checkpointTaskId: opts.checkpoint?.checkpointTaskId,
                    });
                    void this.creditService.claimRunUsage(opts.user, opts.threadId, `${result.agentRunId || opts.runId}:${result.suspension.requestId}`, result.usage?.usage ?? [], 'suspended');
                }
                const intermediateText = await (result.text ?? Promise.resolve(''));
                if (intermediateText) {
                    this.telemetry.track('Builder sent message', {
                        thread_id: opts.threadId,
                        ...(promptVersion ? { prompt_version: promptVersion } : {}),
                        message: (0, telemetry_1.redactTelemetryText)(intermediateText),
                        is_intermediate: true,
                    });
                }
                const messageGroupId = this.tracing.getMessageGroupId(opts.runId);
                const waitingDecision = await this.terminalOutcome.evaluateWaitingResponse(opts.threadId, opts.runId, result.confirmationEvent, { messageGroupId });
                if (waitingDecision?.reason === 'confirmation-invalid') {
                    messageTraceFinalization = await this.terminalOutcome.finishInvalidConfirmationRun({
                        threadId: opts.threadId,
                        runId: opts.runId,
                        promptVersion,
                        abortController: opts.abortController,
                        tracing: opts.tracing,
                    });
                    return;
                }
                if (opts.signal.aborted && !this.shouldPreserveHitlOnShutdown(opts.runId))
                    return;
                if (result.confirmationEvent) {
                    this.trackConfirmationRequest(opts.user.id, opts.threadId, result.confirmationEvent);
                    this.eventBus.publish(opts.threadId, result.confirmationEvent);
                }
                const suspensionOutputs = buildSuspensionTraceOutputs(opts.runId, result.suspension);
                await this.tracing.finalizeRunTracing(opts.runId, opts.tracing, {
                    status: 'suspended',
                    outputs: suspensionOutputs,
                    metadata: {
                        completion_source: 'orchestrator',
                        ...(result.suspension?.requestId ? { request_id: result.suspension.requestId } : {}),
                        ...(result.suspension?.toolCallId
                            ? { pending_tool_call_id: result.suspension.toolCallId }
                            : {}),
                        ...(result.suspension?.toolName
                            ? { pending_tool_name: result.suspension.toolName }
                            : {}),
                    },
                });
                messageTraceFinalization = {
                    status: 'suspended',
                    outputs: suspensionOutputs,
                    metadata: {
                        completion_source: 'orchestrator',
                        ...(result.suspension?.requestId ? { request_id: result.suspension.requestId } : {}),
                        ...(result.suspension?.toolCallId
                            ? { pending_tool_call_id: result.suspension.toolCallId }
                            : {}),
                        ...(result.suspension?.toolName
                            ? { pending_tool_name: result.suspension.toolName }
                            : {}),
                    },
                };
                return;
            }
            if (result.status === 'cancelled' && this.shouldPreserveHitlOnShutdown(opts.runId)) {
                return;
            }
            if (result.status === 'cancelled') {
                const quotaAbort = quotaExhaustedFromSignal(opts.signal);
                if (quotaAbort)
                    throw quotaAbort;
            }
            const outputText = await (result.text ?? Promise.resolve(''));
            resumedRunProducedOutput = outputText.length > 0;
            const messageGroupId = this.tracing.getMessageGroupId(opts.runId);
            const terminalError = result.status === 'errored'
                ? await this.reclassifyMaskedStreamFailure(result.error, opts.user, {
                    threadId: opts.threadId,
                    runId: opts.runId,
                })
                : undefined;
            if (result.status === 'errored') {
                this.instanceAiErrorReporter.report(terminalError ?? new Error('Instance AI resumed stream errored'), {
                    component: 'instance-ai-stream',
                    providerStream: true,
                    threadId: opts.threadId,
                    runId: opts.runId,
                    tracing: opts.tracing,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(opts.runId),
                    userId: opts.user.id,
                    messageGroupId,
                });
            }
            const attachmentRemoved = this.shouldDropTurnAttachments({
                turnHadAttachments: true,
                producedNoOutput: result.status === 'errored' && outputText.length === 0,
            })
                ? await this.dropTurnAttachments({
                    threadId: opts.threadId,
                    resourceId: opts.user.id,
                })
                : undefined;
            const userFacingErrorMessage = result.status === 'errored'
                ? getUserFacingErrorMessage(terminalError, undefined, { attachmentRemoved })
                : undefined;
            const userFacingErrorCode = result.status === 'errored' ? getUserFacingErrorCode(terminalError) : undefined;
            if (runControl.shouldEmitTerminalOutcome(result.stopReason)) {
                await this.terminalOutcome.evaluateTerminalResponse(opts.threadId, opts.runId, result.status, {
                    messageGroupId,
                    workSummary: result.workSummary,
                    errorMessage: userFacingErrorMessage,
                    errorCode: userFacingErrorCode,
                    suppressCompletedFallback: opts.checkpoint?.isCheckpointFollowUp === true ||
                        opts.plannedBuild?.isPlannedBuildFollowUp === true,
                });
            }
            const finalStatus = result.status === 'errored' ? 'error' : result.status;
            await this.tracing.finalizeRunTracing(opts.runId, opts.tracing, {
                status: finalStatus,
                outputText,
                ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
            });
            messageTraceFinalization = {
                status: finalStatus,
                outputText,
                ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
                metadata: await this.tracing.buildMessageTraceMetadata(opts.threadId, opts.runId, {
                    status: finalStatus,
                }),
            };
            const archivedWorkflowIds = await this.temporaryWorkflowService.reapForRun(opts.threadId, opts.user, undefined, this.backgroundTasks.getRunningTasks(opts.threadId).length);
            const resumedSegmentReach = (0, instance_ai_1.deriveInstanceContextReach)(result.workSummary?.toolCalls ?? []);
            const resumedContextReach = (0, instance_ai_1.mergeInstanceContextReach)(opts.instanceContext?.reachSoFar, resumedSegmentReach);
            if (contextTurn) {
                contextSegmentReported = true;
                this.emitInstanceContextTurn(contextTurn, {
                    segment: 'resumed',
                    status: result.status,
                    reach: resumedSegmentReach,
                    workSummary: result.workSummary,
                    usage: result.usage,
                });
            }
            await this.finalizeRun(opts.threadId, opts.runId, result.status, {
                promptVersion,
                userId: opts.user.id,
                ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
                archivedWorkflowIds,
                workSummary: result.workSummary,
                usage: result.usage,
                contextReach: resumedContextReach,
                errorReason: userFacingErrorMessage,
                ...(result.status === 'errored'
                    ? {
                        errorInfo: {
                            errorMessage: terminalError
                                ? (0, get_error_message_1.getErrorMessage)(terminalError)
                                : 'Instance AI resumed stream errored',
                            errorSource: 'stream',
                        },
                    }
                    : {}),
            });
            await this.creditService.claimRunUsage(opts.user, opts.threadId, result.agentRunId || opts.runId, result.usage?.usage ?? [], result.status);
            if (result.status === 'completed') {
                completedSetupWorkflowId = this.getWorkflowSetupSuspensionWorkflowId(opts.toolName, opts.suspendPayload);
                this.telemetry.track('Builder sent message', {
                    thread_id: opts.threadId,
                    ...(promptVersion ? { prompt_version: promptVersion } : {}),
                    message: (0, telemetry_1.redactTelemetryText)(outputText),
                });
                this.telemetry.track('Builder satisfied user intent', {
                    thread_id: opts.threadId,
                    ...(promptVersion ? { prompt_version: promptVersion } : {}),
                });
            }
        }
        catch (error) {
            const quotaAbort = quotaExhaustedFromSignal(opts.signal) ?? asQuotaExhaustedError(error);
            if (quotaAbort)
                blockedForQuota = true;
            if (!resumeClaimed) {
                skipPostRunCleanup = true;
                await this.settleUnclaimedResume(opts, quotaAbort ?? error, 'exception', promptVersion);
                return;
            }
            if (opts.signal.aborted && !quotaAbort && this.shouldPreserveHitlOnShutdown(opts.runId))
                return;
            const contextWork = contextResult
                ? contextResult.workSummary
                : observedContextWork.toSummary();
            const segmentReach = (0, instance_ai_1.deriveInstanceContextReach)(contextWork?.toolCalls ?? []);
            const contextReach = contextTurn
                ? (0, instance_ai_1.mergeInstanceContextReach)(opts.instanceContext?.reachSoFar, segmentReach)
                : undefined;
            if (contextTurn && !contextSegmentReported) {
                contextSegmentReported = true;
                this.emitInstanceContextTurn(contextTurn, {
                    segment: 'resumed',
                    status: opts.signal.aborted && !quotaAbort ? 'cancelled' : 'errored',
                    reach: segmentReach,
                    workSummary: contextWork,
                    usage: contextResult?.usage,
                });
            }
            if (opts.signal.aborted && !quotaAbort) {
                const messageGroupId = this.tracing.getMessageGroupId(opts.runId);
                const runTimeout = this.liveness.consumeRunTimeout(opts.runId);
                const cancellationReason = runTimeout.timedOut
                    ? liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON
                    : getAbortReason(opts.signal);
                if (cancellationReason === liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON) {
                    this.liveness.publishRunTimeoutNotice(opts.threadId, opts.runId);
                }
                await this.terminalOutcome.evaluateTerminalResponse(opts.threadId, opts.runId, 'cancelled', {
                    messageGroupId,
                });
                await this.tracing.finalizeRunTracing(opts.runId, opts.tracing, {
                    status: 'cancelled',
                    reason: cancellationReason,
                });
                messageTraceFinalization = {
                    status: 'cancelled',
                    reason: cancellationReason,
                    metadata: await this.tracing.buildMessageTraceMetadata(opts.threadId, opts.runId, {
                        status: 'cancelled',
                        cancellationReason,
                        runTimeout,
                    }),
                };
                const archivedWorkflowIds = await this.temporaryWorkflowService.reapForRun(opts.threadId, opts.user, undefined, this.backgroundTasks.getRunningTasks(opts.threadId).length);
                this.publishRunFinish(opts.threadId, opts.runId, 'cancelled', cancellationReason, archivedWorkflowIds, opts.user.id, {
                    promptVersion,
                    contextReach,
                    ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
                });
                return;
            }
            const terminalError = quotaAbort ??
                (await this.reclassifyMaskedStreamFailure(error, opts.user, {
                    threadId: opts.threadId,
                    runId: opts.runId,
                }));
            const attachmentRemoved = this.shouldDropTurnAttachments({
                turnHadAttachments: true,
                producedNoOutput: !resumedRunProducedOutput,
            })
                ? await this.dropTurnAttachments({
                    threadId: opts.threadId,
                    resourceId: opts.user.id,
                })
                : undefined;
            const errorMessage = (0, get_error_message_1.getErrorMessage)(terminalError);
            const userFacingErrorMessage = getUserFacingErrorMessage(terminalError, undefined, {
                attachmentRemoved,
            });
            const userFacingErrorCode = getUserFacingErrorCode(terminalError);
            const messageGroupId = this.tracing.getMessageGroupId(opts.runId);
            const errCtx = {
                threadId: opts.threadId,
                runId: opts.runId,
                tracing: opts.tracing,
                agentId: (0, instance_ai_1.orchestratorAgentId)(opts.runId),
                userId: opts.user.id,
                messageGroupId,
            };
            this.logger.error(`Instance AI resumed run error: ${errorMessage}`, {
                error: errorMessage,
                ...(0, observability_1.buildInstanceAiObservabilityContext)(errCtx),
            });
            this.instanceAiErrorReporter.report(terminalError, {
                component: 'instance-ai-run',
                ...errCtx,
            });
            await this.terminalOutcome.evaluateTerminalResponse(opts.threadId, opts.runId, 'errored', {
                messageGroupId,
                errorMessage: userFacingErrorMessage,
                errorCode: userFacingErrorCode,
            });
            await this.tracing.finalizeRunTracing(opts.runId, opts.tracing, {
                status: 'error',
                reason: errorMessage,
            });
            messageTraceFinalization = {
                status: 'error',
                reason: errorMessage,
                metadata: await this.tracing.buildMessageTraceMetadata(opts.threadId, opts.runId, {
                    status: 'error',
                }),
            };
            const archivedWorkflowIds = await this.temporaryWorkflowService.reapForRun(opts.threadId, opts.user, undefined, this.backgroundTasks.getRunningTasks(opts.threadId).length);
            this.publishRunFinish(opts.threadId, opts.runId, 'errored', userFacingErrorMessage, archivedWorkflowIds, opts.user.id, {
                errorMessage,
                errorSource: 'exception',
                promptVersion,
                contextReach,
                ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
            });
        }
        finally {
            this.runState.clearActiveRun(opts.threadId, opts.resumeExecutionToken);
            const segmentSuspended = messageTraceFinalization?.status === 'suspended';
            if (!skipPostRunCleanup && messageTraceFinalization) {
                if (opts.tracing) {
                    await this.tracing.finalizeMessageTraceRoot(opts.runId, opts.tracing, messageTraceFinalization);
                }
                if (messageTraceFinalization.status !== 'cancelled' && !segmentSuspended) {
                    this.liveness.consumeRunTimeout(opts.runId);
                }
            }
            if (!skipPostRunCleanup) {
                this.updateInternalFollowUpFailureStreak(opts.threadId, messageTraceFinalization?.status, false);
            }
            if (!skipPostRunCleanup &&
                !segmentSuspended &&
                !this.runState.hasSuspendedRun(opts.threadId)) {
                const reschedule = !opts.signal.aborted && !blockedForQuota;
                if (opts.checkpoint?.isCheckpointFollowUp) {
                    await this.finalizeCheckpointFollowUp(opts.user, opts.threadId, opts.checkpoint.checkpointTaskId, { reschedule });
                }
                else if (opts.plannedBuild?.isPlannedBuildFollowUp) {
                    await this.finalizePlannedBuildFollowUp(opts.user, opts.threadId, opts.plannedBuild, {
                        reschedule,
                    });
                }
                else if (reschedule) {
                    await this.schedulePlannedTasks(opts.user, opts.threadId);
                }
                if (completedSetupWorkflowId) {
                    await this.markWorkflowSetupHandled(opts.threadId, completedSetupWorkflowId, opts.runId);
                }
                await this.taskProjector.syncFromWorkflowLoop(opts.threadId, opts.runId);
                if (reschedule) {
                    await this.maybeStartWorkflowSetupFollowUp(opts.user, opts.threadId);
                }
            }
            if (errorReporterExecutionToken) {
                this.instanceAiErrorReporter.endRun(opts.runId, errorReporterExecutionToken);
            }
        }
    }
    async settleUnclaimedResume(opts, error, errorSource, promptVersion) {
        const outcome = classifyUnclaimedResume(error, {
            aborted: opts.signal.aborted,
            preserveHitl: this.shouldPreserveHitlOnShutdown(opts.runId),
        });
        switch (outcome.kind) {
            case 'preserve-hitl':
                return;
            case 'stale':
                await this.tracing.finalizeDetachedTraceRun(`stale-resume:${opts.runId}`, opts.unregisteredResumeTracing, {
                    status: 'cancelled',
                    outputs: { runId: opts.runId },
                    metadata: { completion_source: 'stale_resume' },
                });
                return;
            case 'cancelled': {
                const reason = this.liveness.consumeRunTimeout(opts.runId).timedOut
                    ? liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON
                    : getAbortReason(opts.signal);
                await this.tracing.finalizeDetachedTraceRun(`cancelled-resume:${opts.runId}`, opts.unregisteredResumeTracing, {
                    status: 'cancelled',
                    outputs: { runId: opts.runId },
                    metadata: { completion_source: 'resume_cancelled', cancellation_reason: reason },
                });
                await this.emitTerminalRun({
                    threadId: opts.threadId,
                    runId: opts.runId,
                    promptVersion,
                    status: 'cancelled',
                    reason,
                    messageGroupId: opts.messageGroupId,
                    user: opts.user,
                    ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
                });
                return;
            }
            case 'errored':
                this.instanceAiErrorReporter.report(error, {
                    component: 'instance-ai-resume-claim',
                    threadId: opts.threadId,
                    runId: opts.runId,
                    tracing: opts.tracing,
                    agentId: (0, instance_ai_1.orchestratorAgentId)(opts.runId),
                    userId: opts.user.id,
                    messageGroupId: opts.messageGroupId,
                });
                await this.tracing.finalizeDetachedTraceRun(`unclaimed-resume:${opts.runId}`, opts.unregisteredResumeTracing, {
                    status: 'failed',
                    error: outcome.errorMessage,
                    metadata: { completion_source: 'resume_claim' },
                });
                await this.emitTerminalRun({
                    threadId: opts.threadId,
                    runId: opts.runId,
                    promptVersion,
                    status: 'errored',
                    reason: outcome.reason,
                    errorCode: outcome.errorCode,
                    errorInfo: { errorMessage: outcome.errorMessage, errorSource },
                    messageGroupId: opts.messageGroupId,
                    user: opts.user,
                    ...(opts.modelId !== undefined ? { modelId: opts.modelId } : {}),
                });
                return;
            default:
                (0, utils_1.assertNever)(outcome);
        }
    }
    async emitTerminalRun(args) {
        const { threadId, runId, status } = args;
        const context = { threadId, runId };
        await this.bestEffort('Failed to evaluate the terminal response for a settling run', context, async () => await this.terminalOutcome.evaluateTerminalResponse(threadId, runId, status, {
            messageGroupId: args.messageGroupId,
            ...(status === 'errored' ? { errorMessage: args.reason, errorCode: args.errorCode } : {}),
        }));
        const archivedWorkflowIds = (await this.bestEffort('Failed to reap temporary workflows for a settling run', context, async () => await this.temporaryWorkflowService.reapForRun(threadId, args.user, undefined, this.backgroundTasks.getRunningTasks(threadId).length))) ?? [];
        this.publishRunFinish(threadId, runId, status, args.reason, archivedWorkflowIds, args.user.id, {
            ...args.errorInfo,
            promptVersion: args.promptVersion,
            ...(args.modelId !== undefined ? { modelId: args.modelId } : {}),
        });
    }
    async bestEffort(failureMessage, context, step) {
        try {
            return await step();
        }
        catch (error) {
            this.logger.warn(failureMessage, { ...context, error: (0, get_error_message_1.getErrorMessage)(error) });
            return undefined;
        }
    }
    async snapshotAttachedAgents(attachments, orchestrationContext, tracing) {
        const delegate = orchestrationContext.domainContext?.builderDelegate;
        if (!delegate || !tracing)
            return;
        for (const attachment of attachments) {
            if (attachment.type !== 'agent')
                continue;
            let artifact = null;
            try {
                artifact = (await delegate.readAgentArtifact?.(attachment.id)) ?? null;
            }
            catch (error) {
                this.logger.debug(`[agent-snapshot] attached read for ${attachment.id} failed: ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
            if (!artifact)
                continue;
            await (0, instance_ai_1.emitAgentSnapshotTraceEvent)(tracing, {
                agentId: attachment.id,
                projectId: attachment.projectId,
                reason: 'attached',
                artifact,
                logger: this.logger,
            });
        }
    }
    async buildMessageWithRunningTasks(threadId, message) {
        return await (0, instance_ai_1.enrichMessageWithBackgroundTasks)(message, this.backgroundTasks.getRunningTasks(threadId), {
            formatTask: async (task) => `[Running task — ${task.role}]: taskId=${task.taskId}`,
        });
    }
    trackConfirmationRequest(userId, threadId, confirmationEvent) {
        const payload = confirmationEvent.payload;
        const inputThreadId = (0, nanoid_1.nanoid)();
        payload.inputThreadId = inputThreadId;
        const inputType = payload.inputType;
        const mcpConnectServers = api_types_1.mcpConnectRequestSchema.safeParse(payload.mcpConnectRequest).data
            ?.servers;
        let type;
        if (inputType) {
            type = inputType;
        }
        else if (Array.isArray(payload.setupRequests) && payload.setupRequests.length > 0) {
            type = 'setup';
        }
        else if (Array.isArray(payload.credentialRequests) && payload.credentialRequests.length > 0) {
            type = 'credential-setup';
        }
        else if (mcpConnectServers) {
            type = 'mcp-connect';
        }
        else {
            type = 'approval';
        }
        let numSteps = 1;
        if (Array.isArray(payload.questions)) {
            numSteps = payload.questions.length;
        }
        else if (Array.isArray(payload.setupRequests)) {
            numSteps = payload.setupRequests.length;
        }
        else if (Array.isArray(payload.credentialRequests)) {
            numSteps = payload.credentialRequests.length;
        }
        else if (mcpConnectServers) {
            numSteps = mcpConnectServers.length;
        }
        if (inputType === 'plan-review') {
            const planCount = (this.planRequestsByThread.get(threadId) ?? 0) + 1;
            this.planRequestsByThread.set(threadId, planCount);
            type = planCount === 1 ? 'first_plan' : 'revised_plan';
            if (Array.isArray(payload.planItems)) {
                numSteps = payload.planItems.length;
            }
        }
        const credentialRequests = (Array.isArray(payload.credentialRequests) ? payload.credentialRequests : []).filter((request) => typeof request === 'object' && request !== null);
        const containsTemplatedCred = credentialRequests.some((request) => request.credentialType === api_types_1.TEMPLATED_CUSTOM_AUTH_CREDENTIAL_TYPE ||
            (request.setupHint !== null && request.setupHint !== undefined));
        this.telemetry.track('Builder asked for input', {
            user_id: userId,
            thread_id: threadId,
            input_thread_id: inputThreadId,
            type,
            num_steps: numSteps,
            contains_templated_cred: containsTemplatedCred,
        });
        for (const request of credentialRequests) {
            const parsedHint = api_types_1.credentialSetupHintSchema.safeParse(request.setupHint);
            if (!parsedHint.success)
                continue;
            const hint = parsedHint.data;
            this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.BUILDER_SPECCED_TEMPLATED_CRED, {
                thread_id: threadId,
                input_thread_id: inputThreadId,
                template: hint.template,
                placeholders: hint.placeholders,
                test_url: hint.testUrl,
                docs_url: hint.docsUrl,
                service_host: hint.serviceHost,
                accepted_status_codes: hint.acceptedStatusCodes,
            });
        }
    }
    async finalizeCancelledSuspendedRun(suspended, reason = 'user_cancelled') {
        const runTimeout = reason === liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON
            ? this.liveness.consumeRunTimeout(suspended.runId)
            : undefined;
        if (reason === liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON) {
            this.liveness.publishRunTimeoutNotice(suspended.threadId, suspended.runId);
        }
        await this.tracing.finalizeRunTracing(suspended.runId, suspended.tracing, {
            status: 'cancelled',
            reason,
        });
        const archivedWorkflowIds = await this.temporaryWorkflowService.reapForRun(suspended.threadId, suspended.user, undefined, this.backgroundTasks.getRunningTasks(suspended.threadId).length);
        this.publishRunFinish(suspended.threadId, suspended.runId, 'cancelled', reason, archivedWorkflowIds, suspended.user.id, {
            promptVersion: suspended.orchestrationContext?.promptConfiguration?.version,
            contextReach: suspended.instanceContext?.reachSoFar,
            ...(suspended.modelId !== undefined ? { modelId: suspended.modelId } : {}),
        });
        await this.tracing.maybeFinalizeRunTraceRoot(suspended.runId, {
            status: 'cancelled',
            reason,
            metadata: await this.tracing.buildMessageTraceMetadata(suspended.threadId, suspended.runId, {
                status: 'cancelled',
                cancellationReason: reason,
                ...(runTimeout ? { runTimeout } : {}),
            }),
        });
        void this.suspendedThreads.dropPendingConfirmation(suspended.requestId);
    }
    publishRunFinish(threadId, runId, status, reason, archivedWorkflowIds, userId, metadata) {
        const effectiveStatus = status === 'errored' ? 'error' : status;
        const hasArchived = archivedWorkflowIds && archivedWorkflowIds.length > 0;
        this.eventBus.publish(threadId, {
            type: 'run-finish',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            payload: {
                status: effectiveStatus,
                ...(status === 'cancelled'
                    ? { reason: reason ?? 'user_cancelled' }
                    : status === 'errored' && reason
                        ? { reason }
                        : {}),
                ...(hasArchived ? { archivedWorkflowIds } : {}),
                ...(metadata?.contextReach ? { contextReach: metadata.contextReach } : {}),
            },
        });
        this.telemetry.track('instance_ai_run_finished', {
            thread_id: threadId,
            run_id: runId,
            ...(metadata?.promptVersion ? { prompt_version: metadata.promptVersion } : {}),
            ...this.telemetryModelId(metadata?.modelId),
            status: effectiveStatus,
            ...(userId ? { user_id: userId } : {}),
        });
        this.emitBrowserCredentialSetupOutcomes(threadId, runId, status, reason);
        if (status === 'errored') {
            this.telemetry.track('Builder generation errored', {
                thread_id: threadId,
                run_id: runId,
                ...(metadata?.promptVersion ? { prompt_version: metadata.promptVersion } : {}),
                ...this.telemetryModelId(metadata?.modelId),
                error_message: (0, telemetry_1.redactTelemetryText)(metadata?.errorMessage ?? reason ?? 'unknown'),
                ...(metadata?.errorSource ? { error_source: metadata.errorSource } : {}),
                ...(userId ? { user_id: userId } : {}),
            });
        }
    }
    telemetryModelId(modelId) {
        const id = (0, instance_ai_1.modelConfigId)(modelId);
        return id ? { model_id: id } : {};
    }
    createBrowserCredentialSetupTracker(runId, userId) {
        const getOrCreateAttempts = () => {
            let pending = this.pendingBrowserCredentialSetups.get(runId);
            if (!pending) {
                pending = { userId, attempts: [] };
                this.pendingBrowserCredentialSetups.set(runId, pending);
            }
            return pending.attempts;
        };
        const resolveOpenAttempt = (credentialType) => {
            const attempts = getOrCreateAttempts();
            let attempt = attempts.findLast((a) => a.credentialType === credentialType && !a.created);
            if (!attempt) {
                attempt = {
                    credentialType,
                    setupMethod: 'conversation',
                    startedAt: Date.now(),
                    created: false,
                };
                attempts.push(attempt);
            }
            return attempt;
        };
        return {
            markPending: (credentialType, attemptId) => {
                const attempts = getOrCreateAttempts();
                if (attemptId && attempts.some((attempt) => attempt.attemptId === attemptId)) {
                    return;
                }
                attempts.push({
                    credentialType,
                    setupMethod: 'setup_card',
                    attemptId,
                    startedAt: Date.now(),
                    created: false,
                });
            },
            markCreated: (credentialType) => {
                const attempt = resolveOpenAttempt(credentialType);
                attempt.created = true;
                attempt.errorCode = undefined;
            },
            markCreateFailed: (credentialType, errorCode) => {
                resolveOpenAttempt(credentialType).errorCode = errorCode;
            },
        };
    }
    emitBrowserCredentialSetupOutcomes(threadId, runId, runStatus, runFinishReason) {
        const browserSetup = this.pendingBrowserCredentialSetups.get(runId);
        if (!browserSetup)
            return;
        this.pendingBrowserCredentialSetups.delete(runId);
        const terminalErrorCode = runStatus === 'completed'
            ? 'not_attempted'
            : runStatus === 'errored'
                ? 'run_errored'
                : runFinishReason === liveness_1.INSTANCE_AI_RUN_TIMEOUT_REASON
                    ? 'run_timed_out'
                    : 'run_cancelled';
        for (const attempt of browserSetup.attempts) {
            this.telemetry.track('Instance AI Browser Use credential setup completed', {
                user_id: browserSetup.userId,
                credential_type: attempt.credentialType,
                status: attempt.created ? 'success' : 'failure',
                ...(attempt.created
                    ? {}
                    : {
                        failure_stage: failureStageForErrorCode(attempt.errorCode),
                        error_code: attempt.errorCode ?? terminalErrorCode,
                    }),
                is_valid: null,
                is_new: true,
                setup_method: attempt.setupMethod,
                thread_id: threadId,
                run_id: runId,
                ...(attempt.attemptId ? { credential_setup_attempt_id: attempt.attemptId } : {}),
                duration_ms: Date.now() - attempt.startedAt,
            });
        }
    }
    async finalizeRun(threadId, runId, status, options) {
        this.publishRunFinish(threadId, runId, status, options?.errorReason, options?.archivedWorkflowIds, options?.userId, {
            ...options?.errorInfo,
            promptVersion: options?.promptVersion,
            ...(options?.modelId !== undefined ? { modelId: options.modelId } : {}),
            contextReach: options?.contextReach,
        });
        this.emitRunMetrics(threadId, status, options);
        if (status === 'completed' && options?.userId && options?.modelId) {
            void this.refineTitleIfNeeded(threadId, options.userId, options.modelId);
        }
    }
    async persistSuspendedInstanceContext(checkpointKey, instanceContext) {
        if (!instanceContext)
            return;
        try {
            const state = await this.checkpointStore.load(checkpointKey);
            if (!state?.persistence)
                return;
            await this.checkpointStore.save(checkpointKey, {
                ...state,
                persistence: {
                    ...state.persistence,
                    hostMetadata: { ...state.persistence.hostMetadata, instanceContext },
                },
            });
        }
        catch (error) {
            this.logger.warn('Failed to store context for the suspended run', {
                checkpointKey,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    instanceContextTurnBinding(opts) {
        if (!opts.instanceContext)
            return undefined;
        return {
            userId: opts.user.id,
            threadId: opts.threadId,
            runId: opts.runId,
            injection: opts.instanceContext.injection,
            instanceContextEnabled: opts.instanceContext.instanceContextEnabled,
            nodeUsageEnabled: opts.instanceContext.nodeUsageEnabled,
        };
    }
    observeInstanceContextEvents(workSummary) {
        return {
            publish: (threadId, event) => {
                workSummary.observe(event);
                this.eventBus.publish(threadId, event);
            },
            subscribe: (threadId, handler) => this.eventBus.subscribe(threadId, handler),
        };
    }
    emitInstanceContextTurn(turn, input) {
        const { injection } = turn;
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.INSTANCE_CONTEXT_TURN, {
            user_id: turn.userId,
            thread_id: turn.threadId,
            run_id: turn.runId,
            surface: 'aia',
            segment: input.segment,
            instance_context_enabled: turn.instanceContextEnabled,
            node_usage_enabled: turn.nodeUsageEnabled,
            ...(injection.state === 'absent'
                ? { block_state: injection.state, absence_reason: injection.reason }
                : {
                    block_state: injection.state,
                    block_is_update: injection.isUpdate,
                    block_inventory_rows: injection.legs.inventory,
                    block_event_rows: injection.legs.events,
                    block_run_rows: injection.legs.runs,
                    block_chars: injection.chars,
                    block_tokens_estimated: Math.ceil(injection.chars / InstanceAiService_1.BLOCK_CHARS_PER_TOKEN),
                }),
            context_depth: input.reach.surfaces.reduce((deepest, surface) => Math.max(deepest, api_types_1.INSTANCE_CONTEXT_SURFACE_DEPTH[surface]), 0),
            context_surfaces: input.reach.surfaces,
            asked_clarifying_question: input.workSummary?.askedClarifyingQuestion ?? false,
            tool_calls: input.workSummary?.totalToolCalls ?? 0,
            ...(input.usage
                ? {
                    turn_prompt_tokens: input.usage.promptTokens,
                    turn_completion_tokens: input.usage.completionTokens,
                    turn_total_tokens: input.usage.totalTokens,
                    turn_cost_usd: input.usage.costUsd,
                }
                : {}),
            status: input.status,
        });
    }
    emitRunMetrics(threadId, status, options) {
        const startedAt = this.runState.getActiveRun(threadId)?.startedAt;
        this.eventService.emit('instance-ai-run-finished', {
            status: status === 'errored' ? 'error' : status,
            durationMs: status !== 'suspended' && startedAt !== undefined ? Date.now() - startedAt : undefined,
            model: (0, observability_1.runMetricsModelLabel)(options?.modelId),
            toolCalls: options?.workSummary?.totalToolCalls ?? 0,
            toolErrors: options?.workSummary?.totalToolErrors ?? 0,
            ...(options?.usage ? { usage: options.usage } : {}),
        });
    }
    async refineTitleIfNeeded(threadId, userId, modelId) {
        try {
            const memory = this.agentMemory;
            const thread = await memory.getThread(threadId);
            if (!thread?.title)
                return;
            if (thread.metadata?.titleRefined)
                return;
            const history = await memory.getMessages(threadId, { limit: TITLE_REFINE_HISTORY_LIMIT });
            const userTexts = [];
            for (const m of history) {
                if (!('role' in m) || m.role !== 'user')
                    continue;
                const text = (0, internal_messages_1.cleanStoredUserMessage)(this.extractStoredMessageText(m.content));
                if (text && text.length > 0)
                    userTexts.push(text);
                if (userTexts.length >= 5)
                    break;
            }
            if (userTexts.length === 0)
                return;
            const userText = userTexts.join('\n');
            const baseTracing = this.tracing.getTraceContextForContinuation(threadId);
            const titleTracing = await (0, instance_ai_1.createInternalOperationTraceContext)({
                threadId,
                conversationId: threadId,
                messageId: `internal:title:${threadId}`,
                runId: `title-${(0, nanoid_1.nanoid)()}`,
                userId,
                modelId,
                operationName: 'thread_title',
                input: {
                    message_count: userTexts.length,
                    source: 'thread_title_refinement',
                },
                proxyConfig: baseTracing?.proxyConfig,
                metadata: {
                    n8n_version: constants_1.N8N_VERSION || undefined,
                    operation_name: 'thread_title',
                    trigger: 'run_completed',
                },
            });
            const titleTelemetry = titleTracing?.getTelemetry?.({
                agentRole: 'thread_title',
                functionId: 'instance-ai.thread_title',
                executionMode: 'internal',
                metadata: {
                    operation_name: 'thread_title',
                    ...(0, instance_ai_1.modelIdTraceMetadata)(modelId),
                },
            });
            let llmTitle;
            if (titleTracing) {
                try {
                    llmTitle = await titleTracing.withActiveSpan(titleTracing.rootRun, async () => {
                        const title = await (0, instance_ai_1.generateTitleForRun)(modelId, userText, {
                            ...(titleTelemetry ? { telemetry: titleTelemetry } : {}),
                        });
                        if (title) {
                            await titleTracing.finishRun(titleTracing.rootRun, {
                                outputs: { title },
                                metadata: { final_status: 'completed' },
                            });
                        }
                        else {
                            await titleTracing.finishRun(titleTracing.rootRun, {
                                outputs: { title: null },
                                metadata: { final_status: 'skipped' },
                            });
                        }
                        return title;
                    });
                }
                finally {
                    (0, instance_ai_1.releaseTraceClient)(titleTracing.rootRun.traceId);
                }
            }
            else {
                llmTitle = await (0, instance_ai_1.generateTitleForRun)(modelId, userText);
            }
            if (!llmTitle)
                return;
            await (0, instance_ai_1.patchThread)(memory, {
                threadId,
                update: ({ metadata }) => ({
                    title: llmTitle,
                    metadata: { ...metadata, titleRefined: true },
                }),
            });
            this.eventBus.publish(threadId, {
                type: 'thread-title-updated',
                runId: '',
                agentId: 'orchestrator',
                payload: { title: llmTitle },
            });
        }
        catch (error) {
            this.logger.warn('Failed to refine thread title', {
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    extractStoredMessageText(content) {
        if (typeof content === 'string')
            return content;
        if (Array.isArray(content)) {
            return content.flatMap((part) => (isTextMessagePart(part) ? [part.text] : [])).join('\n');
        }
        return '';
    }
    async readRunEvents(threadId, runIds) {
        await this.eventLog.flush(threadId);
        return await this.eventLog.getEventsForRuns(threadId, runIds);
    }
    parseMcpServers(raw) {
        if (!raw.trim())
            return [];
        return raw.split(',').map((entry) => {
            const [name, url] = entry.trim().split('=');
            return { name: name.trim(), url: url?.trim() };
        });
    }
    trackMcpToolCall({ server, toolName, success, }) {
        const serverSlug = server.metadata?.serverSlug;
        const userId = server.metadata?.userId;
        const connectionId = server.metadata?.connectionId;
        if (serverSlug && userId) {
            this.telemetry.track('Instance AI mcp tool called', {
                user_id: userId,
                server_slug: serverSlug,
                tool_name: toolName,
                success,
            });
        }
        if (!success && connectionId && userId) {
            this.push.sendToUsers({ type: 'instanceAiMcpToolCallFailed', data: { connectionId } }, [
                userId,
            ]);
        }
    }
};
exports.InstanceAiService = InstanceAiService;
InstanceAiService.BLOCK_CHARS_PER_TOKEN = 4;
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-instance-ai-task-control', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiService.prototype, "handleRelayTaskControl", null);
exports.InstanceAiService = InstanceAiService = InstanceAiService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, n8n_core_1.InstanceSettings, instance_ai_adapter_service_1.InstanceAiAdapterService, in_process_event_bus_1.InProcessEventBus, durable_event_log_1.DurableEventLog, interrupted_run_sweeper_1.InterruptedRunSweeper, instance_ai_settings_service_1.InstanceAiSettingsService, instance_ai_gateway_service_1.InstanceAiGatewayService, instance_ai_browser_session_service_1.InstanceAiBrowserSessionService, instance_ai_memory_service_1.InstanceAiMemoryService, typeorm_agent_memory_1.TypeORMAgentMemory, typeorm_agent_checkpoint_store_1.TypeORMAgentCheckpointStore, ai_service_1.AiService, instance_ai_thread_grant_repository_1.InstanceAiThreadGrantRepository, instance_ai_pending_confirmation_repository_1.InstanceAiPendingConfirmationRepository, instance_ai_observation_repository_1.InstanceAiObservationRepository, instance_ai_observation_cursor_repository_1.InstanceAiObservationCursorRepository, backend_services_1.UrlService, instance_ai_event_log_repository_1.InstanceAiEventLogRepository, db_iteration_log_storage_1.DbIterationLogStorage, backend_services_1.InstanceWriteAccessService, telemetry_2.Telemetry, mcp_1.InstanceAiMcpRegistryService, db_1.UserRepository, instance_ai_temporary_workflow_service_1.InstanceAiTemporaryWorkflowService, n8n_core_1.ErrorReporter, config_1.SsrfProtectionConfig, backend_network_1.SsrfProtectionService, backend_services_1.EventService, thread_credential_allowlist_service_1.EvalThreadCredentialAllowlistService, instance_ai_run_probe_1.InstanceAiRunProbe, instance_ai_model_service_1.InstanceAiModelService, instance_ai_credit_service_1.InstanceAiCreditService, publisher_service_1.Publisher, instance_ai_error_reporter_service_1.InstanceAiErrorReporterService, push_1.Push, instance_ai_conversation_history_service_1.InstanceAiConversationHistoryService, instance_context_service_1.InstanceContextService, ai_preference_service_1.AiPreferenceService, ai_usage_service_1.AiUsageService, instance_ai_thread_tabs_service_1.InstanceAiThreadTabsService, instance_ai_skills_service_1.InstanceAiSkillsService])
], InstanceAiService);
//# sourceMappingURL=instance-ai.service.js.map