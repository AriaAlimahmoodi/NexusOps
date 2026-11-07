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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSessionLangSmithExportService = void 0;
const agents_1 = require("@n8n/agents");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const pii_patterns_1 = require("@n8n/utils/redaction/pii-patterns");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const uuid_1 = require("uuid");
const constants_1 = require("../../constants");
const errors_1 = require("@n8n/errors");
const ai_service_1 = require("../../services/ai.service");
const proxy_token_manager_1 = require("../../services/proxy-token-manager");
const ai_proxy_fetch_1 = require("../../utils/ai-proxy-fetch");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_execution_thread_repository_1 = require("./repositories/agent-execution-thread.repository");
const LANGSMITH_PROJECT = 'n8n-user-agents-debug';
const MAX_RUNS_PER_BATCH = 100;
const MAX_BATCH_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FIELD_CHARS = 50_000;
const EXPORT_TIMEOUT_MS = 60_000;
const EXPORT_NAMESPACE = (0, uuid_1.v5)('n8n-agent-session-langsmith-export', uuid_1.v5.URL);
const REDACTION_OPTIONS = {
    secrets: true,
    detect: pii_patterns_1.SUPPORTED_PII_CATEGORIES,
    preserveUrlStructure: true,
    redactSensitiveKeys: true,
};
let AgentSessionLangSmithExportService = class AgentSessionLangSmithExportService {
    constructor(logger, aiService, outboundHttp, agentExecutionService, threadRepository) {
        this.logger = logger;
        this.aiService = aiService;
        this.outboundHttp = outboundHttp;
        this.agentExecutionService = agentExecutionService;
        this.threadRepository = threadRepository;
    }
    async exportSession(input) {
        this.ensureEnabled();
        const tree = await this.loadSessionTree(input.threadId, input.projectId, input.agentId, input.user.id, new Set());
        const draft = buildSessionRun(tree, `sessions/${tree.thread.id}`);
        const traceId = (0, uuid_1.v5)(canonicalSerialize(draft), EXPORT_NAMESPACE);
        const { convertToDottedOrderFormat } = await import('langsmith/run_trees');
        const runs = materializeRuns(draft, traceId, convertToDottedOrderFormat);
        const startedAt = Date.now();
        let batchCount = 0;
        try {
            const batches = batchRuns(runs);
            batchCount = batches.length;
            const client = await this.createClient(input.user);
            await sendBatchesWithTimeout(client, batches);
        }
        catch (error) {
            this.logger.error('Failed to export agent session to LangSmith', {
                projectId: input.projectId,
                agentId: input.agentId,
                threadId: input.threadId,
                runCount: runs.length,
                batchCount,
                elapsedMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new errors_1.ServiceUnavailableError("Session couldn't be sent to LangSmith. Try again.");
        }
        return { traceId };
    }
    ensureEnabled() {
        if (!this.aiService.isProxyEnabled()) {
            throw new errors_1.NotFoundError('LangSmith debug export is not enabled');
        }
    }
    async loadSessionTree(threadId, projectId, agentId, userId, visited) {
        if (visited.has(threadId)) {
            throw new errors_1.ConflictError('Agent session contains a cyclic child link');
        }
        visited.add(threadId);
        const detail = await this.agentExecutionService.getThreadDetail(threadId, projectId, agentId, userId);
        if (!detail) {
            throw new errors_1.NotFoundError(`Thread "${threadId}" not found`);
        }
        this.ensureSettled(detail);
        const childThreads = await this.threadRepository.findByParentThreadId(threadId, projectId);
        const children = [];
        for (const child of childThreads) {
            if (child.parentThreadId !== detail.thread.id ||
                child.parentAgentId !== detail.thread.agentId ||
                child.projectId !== detail.thread.projectId) {
                throw new errors_1.ConflictError('Agent session child link is invalid');
            }
            children.push(await this.loadSessionTree(child.id, projectId, child.agentId, userId, visited));
        }
        return { ...detail, children };
    }
    ensureSettled(detail) {
        if (detail.executions.some((execution) => execution.status === 'running')) {
            throw new errors_1.ConflictError('Session is still running');
        }
        if (detail.executions.some((execution) => execution.storedAt !== 'db' && execution.timeline === null)) {
            throw new errors_1.ServiceUnavailableError("Session couldn't be exported because some execution data is unavailable. Try again.");
        }
    }
    async createClient(user) {
        const proxyClient = await this.aiService.getClient();
        const proxyBaseUrl = proxyClient.getApiProxyBaseUrl().replace(/\/$/, '');
        const tokenManager = new proxy_token_manager_1.ProxyTokenManager(async () => {
            return await proxyClient.getBuilderApiProxyToken({ id: user.id }, { userMessageId: (0, nanoid_1.nanoid)() });
        });
        const proxyHeaders = (0, api_types_1.buildProxyHeaders)({
            feature: 'agent-builder',
            n8nVersion: constants_1.N8N_VERSION,
        });
        const transportFetch = (0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp);
        const fetchImplementation = async (request, init) => {
            const headers = new Headers(init?.headers);
            const authHeaders = await tokenManager.getAuthHeaders();
            for (const [key, value] of Object.entries({ ...proxyHeaders, ...authHeaders })) {
                headers.set(key, value);
            }
            if (!headers.has('Accept-Encoding')) {
                headers.set('Accept-Encoding', 'gzip, deflate');
            }
            const response = await transportFetch(request, { ...init, headers });
            return response.status === 409
                ? new Response(null, { status: 200, statusText: 'OK (409 suppressed)' })
                : response;
        };
        const { Client: LangSmithClient } = await import('langsmith');
        return new LangSmithClient({
            apiUrl: proxyBaseUrl + '/langsmith',
            apiKey: '-',
            autoBatchTracing: false,
            fetchImplementation,
        });
    }
};
exports.AgentSessionLangSmithExportService = AgentSessionLangSmithExportService;
exports.AgentSessionLangSmithExportService = AgentSessionLangSmithExportService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, ai_service_1.AiService, backend_network_1.OutboundHttp, agent_execution_service_1.AgentExecutionService, agent_execution_thread_repository_1.AgentExecutionThreadRepository])
], AgentSessionLangSmithExportService);
function buildSessionRun(session, path) {
    const matchedChildren = new Set();
    const childSessions = new Map(session.children.map((child) => [child.thread.id, child]));
    const executionRuns = session.executions.map((execution) => buildExecutionRun(execution, path, childSessions, matchedChildren));
    const unmatchedChildren = session.children
        .filter((child) => !matchedChildren.has(child.thread.id))
        .map((child) => buildSessionRun(child, `${path}/children/${child.thread.id}`));
    const startTime = session.executions[0]?.startedAt?.getTime() ??
        session.executions[0]?.createdAt.getTime() ??
        session.thread.createdAt.getTime();
    const lastExecution = session.executions.at(-1);
    const endTime = lastExecution?.stoppedAt?.getTime() ??
        lastExecution?.updatedAt.getTime() ??
        session.thread.updatedAt.getTime();
    return truncateDraftRun({
        path,
        name: `Agent session: ${session.thread.agentName}`,
        runType: 'chain',
        startTime,
        endTime,
        inputs: {
            title: session.thread.title,
            taskId: session.thread.taskId,
        },
        outputs: {
            executionCount: session.executions.length,
            childSessionCount: session.children.length,
        },
        metadata: {
            n8nVersion: constants_1.N8N_VERSION,
            threadId: session.thread.id,
            agentId: session.thread.agentId,
            agentName: session.thread.agentName,
            projectId: session.thread.projectId,
            parentThreadId: session.thread.parentThreadId,
            parentAgentId: session.thread.parentAgentId,
            sessionNumber: session.thread.sessionNumber,
            taskId: session.thread.taskId,
            taskVersionId: session.thread.taskVersionId,
            totalPromptTokens: session.thread.totalPromptTokens,
            totalCompletionTokens: session.thread.totalCompletionTokens,
            totalCost: session.thread.totalCost,
            totalDuration: session.thread.totalDuration,
        },
        children: [...executionRuns, ...unmatchedChildren],
    });
}
function buildExecutionRun(execution, sessionPath, childSessions, matchedChildren) {
    const path = `${sessionPath}/executions/${execution.id}`;
    const events = execution.timeline ?? [];
    const children = events.map((event, index) => {
        const eventRun = truncateDraftRun(buildEventRun(event, execution, `${path}/events/${index}`));
        const childThreadId = delegatedChildThreadId(event);
        const childSession = childThreadId ? childSessions.get(childThreadId) : undefined;
        if (childSession && !matchedChildren.has(childSession.thread.id)) {
            matchedChildren.add(childSession.thread.id);
            eventRun.children.push(buildSessionRun(childSession, `${eventRun.path}/children/${childSession.thread.id}`));
        }
        return eventRun;
    });
    const startTime = execution.startedAt?.getTime() ?? execution.createdAt.getTime();
    const endTime = execution.stoppedAt?.getTime() ?? execution.updatedAt.getTime();
    return truncateDraftRun({
        path,
        name: 'Agent turn',
        runType: 'chain',
        startTime,
        endTime,
        inputs: {
            message: execution.userMessage,
            attachments: execution.attachments,
        },
        outputs: { status: execution.status },
        error: execution.error ?? undefined,
        metadata: executionMetadata(execution),
        children,
    });
}
function buildEventRun(event, execution, path) {
    switch (event.type) {
        case 'input':
            return {
                path,
                name: 'Additional user input',
                runType: 'chain',
                startTime: event.timestamp,
                endTime: event.timestamp,
                inputs: {
                    message: execution.inputMessages?.find(({ id }) => id === event.messageId),
                },
                outputs: {},
                metadata: {},
                children: [],
            };
        case 'background-task-signal':
            return buildBackgroundTaskSignalRun(event, path);
        case 'text':
            return buildTextRun(event, execution, path);
        case 'reasoning':
            return buildReasoningRun(event, path);
        case 'suspension':
            return buildSuspensionRun(event, path);
        case 'hitl-response':
            return buildHitlResponseRun(event, path);
        case 'tool-call':
            return buildToolCallRun(event, path);
    }
}
function buildBackgroundTaskSignalRun(event, path) {
    return {
        path,
        name: 'Background task results received',
        runType: 'chain',
        startTime: event.timestamp,
        endTime: event.timestamp,
        inputs: { tasks: event.signal.tasks },
        outputs: {},
        metadata: {},
        children: [],
    };
}
function buildTextRun(event, execution, path) {
    return {
        path,
        name: 'Agent response',
        runType: 'llm',
        startTime: event.timestamp,
        endTime: event.endTime ?? event.timestamp,
        inputs: {},
        outputs: { text: event.content },
        metadata: executionUsageMetadata(execution),
        children: [],
    };
}
function buildReasoningRun(event, path) {
    return {
        path,
        name: 'Reasoning',
        runType: 'chain',
        startTime: event.timestamp,
        endTime: event.endTime ?? event.timestamp,
        inputs: {},
        outputs: { content: event.content },
        metadata: {},
        children: [],
    };
}
function buildSuspensionRun(event, path) {
    return {
        path,
        name: 'Suspension',
        runType: 'chain',
        startTime: event.timestamp,
        endTime: event.timestamp,
        inputs: {
            toolName: event.toolName,
            toolCallId: event.toolCallId,
        },
        outputs: { status: 'suspended' },
        metadata: {},
        children: [],
    };
}
function buildHitlResponseRun(event, path) {
    return {
        path,
        name: 'HITL response',
        runType: 'chain',
        startTime: event.timestamp,
        endTime: event.timestamp,
        inputs: { toolCallId: event.toolCallId },
        outputs: toRecord(event.response),
        metadata: {},
        children: [],
    };
}
function buildToolCallRun(event, path) {
    return {
        path,
        name: event.name,
        runType: 'tool',
        startTime: event.startTime,
        endTime: event.endTime,
        inputs: toRecord(event.input),
        outputs: {
            ...toRecord(event.output),
            ...(event.childTrace ? { childTrace: event.childTrace } : {}),
        },
        error: event.success ? undefined : toolError(event.output),
        metadata: {
            kind: event.kind,
            toolCallId: event.toolCallId,
            success: event.success,
            workflowId: event.workflowId,
            workflowName: event.workflowName,
            workflowExecutionId: event.workflowExecutionId,
            triggerType: event.triggerType,
            nodeType: event.nodeType,
            nodeTypeVersion: event.nodeTypeVersion,
            nodeDisplayName: event.nodeDisplayName,
            nodeParameters: event.nodeParameters,
        },
        children: [],
    };
}
function executionMetadata(execution) {
    return {
        executionId: execution.id,
        status: execution.status,
        hitlStatus: execution.hitlStatus,
        source: execution.source,
        storedAt: execution.storedAt,
        ...executionUsageMetadata(execution),
    };
}
function executionUsageMetadata(execution) {
    return {
        model: execution.model,
        promptTokens: execution.promptTokens,
        completionTokens: execution.completionTokens,
        totalTokens: execution.totalTokens,
        cost: execution.cost,
        duration: execution.duration,
    };
}
function delegatedChildThreadId(event) {
    if (event.type !== 'tool-call' || event.name !== 'delegate_subagent')
        return undefined;
    if (!(0, is_record_1.isRecord)(event.output))
        return undefined;
    const { threadId } = event.output;
    return typeof threadId === 'string' ? threadId : undefined;
}
function toolError(output) {
    if (typeof output === 'string')
        return output;
    if ((0, is_record_1.isRecord)(output)) {
        if (typeof output.error === 'string')
            return output.error;
        if (typeof output.message === 'string')
            return output.message;
    }
    return 'Tool call failed';
}
function toRecord(value) {
    return (0, is_record_1.isRecord)(value) ? value : { value };
}
function truncateDraftRun(run) {
    return {
        ...run,
        inputs: truncateRecord(sanitizeRecord(run.inputs)),
        outputs: run.outputs ? truncateRecord(sanitizeRecord(run.outputs)) : undefined,
        error: run.error ? truncateText(scrubText(run.error)) : undefined,
    };
}
function truncateRecord(value) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, truncateValue(item)]));
}
function truncateValue(value) {
    if (typeof value === 'string')
        return truncateText(value);
    if (Array.isArray(value))
        return value.map(truncateValue);
    if ((0, is_record_1.isRecord)(value))
        return truncateRecord(value);
    return value;
}
function truncateText(value) {
    if (value.length <= MAX_FIELD_CHARS)
        return value;
    return `${value.slice(0, MAX_FIELD_CHARS)}… [truncated ${value.length - MAX_FIELD_CHARS} chars]`;
}
function materializeRuns(root, traceId, convertToDottedOrderFormat) {
    const runs = [];
    const visit = (draft, parentRunId, parentDottedOrder, siblingOrder) => {
        const id = parentRunId ? (0, uuid_1.v5)(draft.path, traceId) : traceId;
        const segment = convertToDottedOrderFormat(draft.startTime, id, siblingOrder).dottedOrder;
        const dottedOrder = parentDottedOrder ? `${parentDottedOrder}.${segment}` : segment;
        const sanitized = {
            name: scrubText(draft.name),
            inputs: sanitizeRecord(draft.inputs),
            outputs: draft.outputs ? sanitizeRecord(draft.outputs) : undefined,
            error: draft.error ? scrubText(draft.error) : undefined,
            extra: { metadata: sanitizeRecord(draft.metadata) },
        };
        runs.push({
            ...sanitized,
            id,
            trace_id: traceId,
            parent_run_id: parentRunId,
            dotted_order: dottedOrder,
            run_type: draft.runType,
            start_time: draft.startTime,
            end_time: draft.endTime,
            session_name: LANGSMITH_PROJECT,
        });
        draft.children.forEach((child, index) => {
            visit(child, id, dottedOrder, index + 1);
        });
    };
    visit(root, undefined, undefined, 1);
    return runs;
}
function batchRuns(runs) {
    const batches = [];
    let batch = [];
    const emptyBatchSize = serializedSize({ post: [], patch: [] });
    let batchSize = emptyBatchSize;
    for (const run of runs) {
        const separatorSize = batch.length > 0 ? 1 : 0;
        const runSize = serializedSize(run);
        if (emptyBatchSize + runSize > MAX_BATCH_SIZE_BYTES) {
            throw new n8n_workflow_1.UserError('LangSmith run exceeds maximum batch size');
        }
        if (batch.length > 0 &&
            (batch.length >= MAX_RUNS_PER_BATCH ||
                batchSize + separatorSize + runSize > MAX_BATCH_SIZE_BYTES)) {
            batches.push(batch);
            batch = [];
            batchSize = emptyBatchSize;
        }
        batch.push(run);
        batchSize += (batch.length > 1 ? 1 : 0) + runSize;
    }
    if (batch.length > 0)
        batches.push(batch);
    return batches;
}
function serializedSize(value) {
    return Buffer.byteLength(JSON.stringify(value) ?? '');
}
async function sendBatchesWithTimeout(client, batches) {
    let timedOut = false;
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            timedOut = true;
            reject(new errors_1.ServiceUnavailableError("Session couldn't be sent to LangSmith. Try again."));
        }, EXPORT_TIMEOUT_MS);
    });
    const uploadPromise = (async () => {
        for (const batch of batches) {
            if (timedOut)
                return;
            await client.batchIngestRuns({ runCreates: batch });
        }
    })();
    try {
        await Promise.race([uploadPromise, timeoutPromise]);
    }
    finally {
        if (timeoutId)
            clearTimeout(timeoutId);
    }
}
function sanitizeRecord(value) {
    const sanitized = (0, agents_1.redactDeep)(value, REDACTION_OPTIONS).value;
    return (0, is_record_1.isRecord)(sanitized) ? sanitized : {};
}
function scrubText(value) {
    return (0, agents_1.redactText)(value, REDACTION_OPTIONS).text;
}
function canonicalSerialize(value) {
    return (JSON.stringify(value, (_key, item) => (0, is_record_1.isRecord)(item)
        ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
        : item) ?? '{}');
}
//# sourceMappingURL=agent-session-langsmith-export.service.js.map