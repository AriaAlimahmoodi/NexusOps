"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionRecorder = void 0;
exports.buildApprovalArgs = buildApprovalArgs;
const api_types_1 = require("@n8n/api-types");
const is_record_1 = require("@n8n/utils/is-record");
const sensitive_key_1 = require("@n8n/utils/redaction/sensitive-key");
const scrub_secrets_1 = require("@n8n/utils/scrub-secrets");
const n8n_workflow_1 = require("n8n-workflow");
const CHILD_TRACE_PERSIST_CHAR_BUDGET = 4_000;
const TIMELINE_BLOCK_MAX_DURATION_MS = 1_000;
function resolveTemplatesInValue(value, llmArgs) {
    if (typeof value === 'string')
        return resolveTemplatesInString(value, llmArgs);
    if (Array.isArray(value))
        return value.map((v) => resolveTemplatesInValue(v, llmArgs));
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = resolveTemplatesInValue(v, llmArgs);
        }
        return out;
    }
    return value;
}
function resolveTemplatesInString(str, llmArgs) {
    const afterFromAI = resolveFromAIInString(str, llmArgs);
    if (typeof afterFromAI !== 'string')
        return afterFromAI;
    return resolveJsonRefsInString(afterFromAI, llmArgs);
}
function resolveFromAIInString(str, llmArgs) {
    if (!str.includes('$fromAI'))
        return str;
    let calls;
    try {
        calls = (0, n8n_workflow_1.extractFromAICalls)(str);
    }
    catch {
        return str;
    }
    if (calls.length === 0)
        return str;
    if ((0, n8n_workflow_1.isFromAIOnlyExpression)(str)) {
        const call = calls[0];
        if (call.key in llmArgs)
            return llmArgs[call.key];
        if (call.defaultValue !== undefined)
            return call.defaultValue;
        return str;
    }
    const pattern = /\$fromAI\s*\([^)]*\)/g;
    return str.replace(pattern, (match) => {
        try {
            const inner = (0, n8n_workflow_1.extractFromAICalls)(match);
            if (inner.length === 0)
                return match;
            const call = inner[0];
            const resolved = call.key in llmArgs
                ? llmArgs[call.key]
                : call.defaultValue !== undefined
                    ? call.defaultValue
                    : undefined;
            if (resolved === undefined)
                return match;
            if (typeof resolved === 'object')
                return JSON.stringify(resolved);
            return String(resolved);
        }
        catch {
            return match;
        }
    });
}
const FULL_JSON_REF_PATTERN = /^=\s*\{\{\s*\$json((?:\s*\.\s*[a-zA-Z_$][\w$]*)+)\s*\}\}\s*$/;
const INLINE_JSON_REF_PATTERN = /\{\{\s*\$json((?:\s*\.\s*[a-zA-Z_$][\w$]*)+)\s*\}\}/g;
function resolveJsonRefsInString(str, llmArgs) {
    if (!str.startsWith('=') || !str.includes('$json'))
        return str;
    const fullMatch = str.match(FULL_JSON_REF_PATTERN);
    if (fullMatch) {
        const resolved = lookupJsonPath(llmArgs, fullMatch[1]);
        return resolved === undefined ? str : resolved;
    }
    let replaced = false;
    const out = str.replace(INLINE_JSON_REF_PATTERN, (match, path) => {
        const resolved = lookupJsonPath(llmArgs, path);
        if (resolved === undefined)
            return match;
        replaced = true;
        if (typeof resolved === 'object')
            return JSON.stringify(resolved);
        return String(resolved);
    });
    return replaced ? out : str;
}
function lookupJsonPath(root, dottedPath) {
    const segments = dottedPath
        .split('.')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    let cur = root;
    for (const seg of segments) {
        if (cur === null || cur === undefined)
            return undefined;
        if (typeof cur !== 'object')
            return undefined;
        cur = cur[seg];
    }
    return cur;
}
function normaliseToolErrorOutput(output) {
    if (output instanceof Error) {
        return { error: output.message || output.name || 'Tool execution failed' };
    }
    if (typeof output === 'string') {
        return { error: output };
    }
    return output;
}
function normaliseStreamError(error) {
    if (error instanceof Error) {
        return (0, scrub_secrets_1.scrubSecretsInText)(error.message || error.name || 'Agent execution failed');
    }
    if (typeof error === 'string')
        return (0, scrub_secrets_1.scrubSecretsInText)(error);
    const sanitized = sanitizeExecutionLogValue(error);
    try {
        return (0, scrub_secrets_1.scrubSecretsInText)(JSON.stringify(sanitized));
    }
    catch {
        return (0, scrub_secrets_1.scrubSecretsInText)(String(error));
    }
}
const REDACTED_VALUE = '[REDACTED]';
const CIRCULAR_VALUE = '[Circular]';
function sanitizeExecutionLogValue(value, seen = new WeakSet()) {
    if (typeof value === 'string')
        return (0, scrub_secrets_1.scrubSecretsInText)(value);
    if (Array.isArray(value)) {
        if (seen.has(value))
            return CIRCULAR_VALUE;
        seen.add(value);
        const sanitized = value.map((item) => sanitizeExecutionLogValue(item, seen));
        seen.delete(value);
        return sanitized;
    }
    if (!(0, is_record_1.isRecord)(value))
        return value;
    if (seen.has(value))
        return CIRCULAR_VALUE;
    seen.add(value);
    const sanitized = {};
    for (const [key, item] of Object.entries(value)) {
        sanitized[key] = (0, sensitive_key_1.isSensitiveKey)(key) ? REDACTED_VALUE : sanitizeExecutionLogValue(item, seen);
    }
    seen.delete(value);
    return sanitized;
}
function sanitizeExecutionLogRecord(value) {
    const sanitized = sanitizeExecutionLogValue(value);
    return (0, is_record_1.isRecord)(sanitized) ? sanitized : undefined;
}
function buildApprovalArgs(input, entry) {
    const sanitizedInput = sanitizeExecutionLogValue(input);
    if (!entry?.nodeParameters || Object.keys(entry.nodeParameters).length === 0) {
        return sanitizedInput;
    }
    return {
        parameters: sanitizeExecutionLogRecord(resolveTemplatesInValue(entry.nodeParameters, (0, is_record_1.isRecord)(sanitizedInput) ? sanitizedInput : {})),
        ...((0, is_record_1.isRecord)(input) && Object.keys(input).length === 0 ? {} : { input: sanitizedInput }),
    };
}
class ExecutionRecorder {
    constructor(registry, onTimelineSnapshot, backgroundJobSignal, startedAt = new Date()) {
        this.onTimelineSnapshot = onTimelineSnapshot;
        this.textParts = [];
        this.textBuffer = [];
        this.reasoningBuffer = [];
        this.model = null;
        this.finishReason = 'unknown';
        this.usage = null;
        this.totalCost = null;
        this.timeline = [];
        this.textStartTime = null;
        this.reasoningStartTime = null;
        this._suspended = false;
        this.error = null;
        this.childTraceChars = new Map();
        this.startTime = startedAt.getTime();
        this.registry = registry ?? new Map();
        if (backgroundJobSignal) {
            this.timeline.push({
                type: 'background-task-signal',
                timestamp: this.startTime,
                signal: {
                    tasks: backgroundJobSignal.tasks.map(({ id, title, kind, status }) => ({
                        id,
                        title: (0, scrub_secrets_1.scrubSecretsInText)(title),
                        kind,
                        status,
                    })),
                },
            });
        }
    }
    recordInputs(events) {
        this.flushReasoningBuffer();
        this.flushTextBuffer();
        for (const event of events) {
            if (this.timeline.some((item) => item.type === 'input' && item.messageId === event.messageId))
                continue;
            this.appendCompletedEvent(event);
        }
    }
    recordHitlResponse(toolCallId, response) {
        this.flushReasoningBuffer();
        this.flushTextBuffer();
        this.appendCompletedEvent({
            type: 'hitl-response',
            toolCallId,
            response: sanitizeExecutionLogValue(response),
            timestamp: Date.now(),
        });
    }
    record(chunk) {
        switch (chunk.type) {
            case 'text-delta':
                this.flushReasoningBuffer();
                if (this.textStartTime === null) {
                    this.textStartTime = Date.now();
                }
                this.textParts.push(chunk.delta);
                this.textBuffer.push(chunk.delta);
                this.scheduleTimelineSnapshot();
                break;
            case 'reasoning-start':
                this.flushTextBuffer();
                this.flushReasoningBuffer();
                this.reasoningStartTime = Date.now();
                break;
            case 'reasoning-delta':
                this.flushTextBuffer();
                if (this.reasoningStartTime === null) {
                    this.reasoningStartTime = Date.now();
                }
                this.reasoningBuffer.push(chunk.delta);
                this.scheduleTimelineSnapshot();
                break;
            case 'reasoning-end':
                this.flushReasoningBuffer();
                break;
            case 'tool-call':
                this.recordToolCall(chunk.toolCallId, chunk.toolName, chunk.input);
                break;
            case 'tool-execution-start':
                this.recordToolExecutionStart(chunk.toolCallId, chunk.startTime);
                break;
            case 'tool-execution-end':
                this.recordToolExecutionEnd(chunk.toolCallId, chunk.isError, chunk.endTime);
                break;
            case 'subagent-chunk': {
                if (chunk.parentToolCallId === undefined)
                    break;
                const entry = this.findOpenTimelineToolCall(chunk.parentToolCallId);
                if (!entry)
                    break;
                let inner = chunk.chunk;
                if (inner.type === 'text-delta' || inner.type === 'reasoning-delta') {
                    const used = this.childTraceChars.get(chunk.parentToolCallId) ?? 0;
                    const remaining = CHILD_TRACE_PERSIST_CHAR_BUDGET - used;
                    if (remaining <= 0)
                        break;
                    const delta = inner.delta.slice(0, remaining);
                    this.childTraceChars.set(chunk.parentToolCallId, used + delta.length);
                    inner = { ...inner, delta };
                }
                entry.childTrace ??= (0, api_types_1.emptyChildTrace)();
                (0, api_types_1.applyForwardedChildChunk)(entry.childTrace, inner);
                this.scheduleTimelineSnapshot();
                break;
            }
            case 'tool-result':
                this.recordToolResult(chunk.toolCallId, chunk.toolName, chunk.output, chunk.isError === true);
                break;
            case 'finish':
                this.flushReasoningBuffer();
                this.flushTextBuffer();
                this.finishReason = chunk.finishReason;
                if (chunk.usage) {
                    this.usage = {
                        promptTokens: chunk.usage.promptTokens,
                        completionTokens: chunk.usage.completionTokens,
                        totalTokens: chunk.usage.totalTokens,
                    };
                }
                this.model = chunk.model ?? null;
                this.totalCost = chunk.usage?.cost ?? null;
                break;
            case 'tool-call-suspended':
                this.flushReasoningBuffer();
                this.flushTextBuffer();
                this._suspended = true;
                this.appendCompletedEvent({
                    type: 'suspension',
                    toolName: chunk.toolName ?? '',
                    toolCallId: chunk.toolCallId ?? '',
                    timestamp: Date.now(),
                    ...(chunk.input !== undefined && {
                        input: sanitizeExecutionLogValue(chunk.input),
                    }),
                    ...(chunk.suspendPayload !== undefined && {
                        suspendPayload: sanitizeExecutionLogValue(chunk.suspendPayload),
                    }),
                });
                break;
            case 'error': {
                this.flushReasoningBuffer();
                this.flushTextBuffer();
                this.error ??= normaliseStreamError(chunk.error);
                break;
            }
        }
    }
    get suspended() {
        return this._suspended;
    }
    get startedAt() {
        return new Date(this.startTime);
    }
    getMessageRecord() {
        clearTimeout(this.timelineSnapshotTimer);
        this.timelineSnapshotTimer = undefined;
        this.flushReasoningBuffer();
        this.flushTextBuffer();
        return {
            assistantResponse: this.textParts.join(''),
            model: this.model,
            finishReason: this.finishReason,
            usage: this.usage,
            totalCost: this.totalCost,
            timeline: this.timeline,
            startTime: this.startTime,
            duration: Date.now() - this.startTime,
            error: this.error,
        };
    }
    flushTextBuffer() {
        if (this.textStartTime !== null && this.timelineSnapshotTimer) {
            clearTimeout(this.timelineSnapshotTimer);
            this.timelineSnapshotTimer = undefined;
        }
        if (this.textBuffer.length === 0)
            return;
        const content = this.textBuffer.join('');
        if (content.trim()) {
            const now = Date.now();
            this.appendCompletedEvent({
                type: 'text',
                content,
                timestamp: this.textStartTime ?? now,
                endTime: now,
            });
        }
        this.textBuffer = [];
        this.textStartTime = null;
    }
    flushReasoningBuffer() {
        if (this.reasoningStartTime !== null && this.timelineSnapshotTimer) {
            clearTimeout(this.timelineSnapshotTimer);
            this.timelineSnapshotTimer = undefined;
        }
        if (this.reasoningBuffer.length === 0) {
            this.reasoningStartTime = null;
            return;
        }
        const content = this.reasoningBuffer.join('');
        if (content.trim()) {
            const now = Date.now();
            this.appendCompletedEvent({
                type: 'reasoning',
                content,
                timestamp: this.reasoningStartTime ?? now,
                endTime: now,
            });
        }
        this.reasoningBuffer = [];
        this.reasoningStartTime = null;
    }
    scheduleTimelineSnapshot() {
        if (this.timelineSnapshotTimer)
            return;
        this.timelineSnapshotTimer = setTimeout(() => {
            this.timelineSnapshotTimer = undefined;
            const now = Date.now();
            if (this.textStartTime !== null && this.textBuffer.length > 0) {
                this.emitTimelineSnapshot({
                    type: 'text',
                    content: this.textBuffer.join(''),
                    timestamp: this.textStartTime,
                    endTime: now,
                });
            }
            else if (this.reasoningStartTime !== null && this.reasoningBuffer.length > 0) {
                this.emitTimelineSnapshot({
                    type: 'reasoning',
                    content: this.reasoningBuffer.join(''),
                    timestamp: this.reasoningStartTime,
                    endTime: now,
                });
            }
            else {
                this.emitTimelineSnapshot();
            }
        }, TIMELINE_BLOCK_MAX_DURATION_MS);
        this.timelineSnapshotTimer.unref();
    }
    recordToolCall(toolCallId, name, input) {
        this.flushReasoningBuffer();
        this.flushTextBuffer();
        const recordedInput = sanitizeExecutionLogValue(input);
        const entry = this.registry.get(name);
        const llmArgs = input !== null && typeof input === 'object' ? input : {};
        const resolvedNodeParameters = entry?.nodeParameters !== undefined
            ? sanitizeExecutionLogRecord(resolveTemplatesInValue(entry.nodeParameters, llmArgs))
            : undefined;
        this.timeline.push({
            type: 'tool-call',
            kind: entry?.kind ?? 'tool',
            name,
            toolCallId,
            input: recordedInput,
            output: undefined,
            startTime: Date.now(),
            endTime: 0,
            success: false,
            workflowId: entry?.workflowId,
            workflowName: entry?.workflowName,
            triggerType: entry?.triggerType,
            nodeType: entry?.nodeType,
            nodeTypeVersion: entry?.nodeTypeVersion,
            nodeDisplayName: entry?.nodeDisplayName,
            nodeParameters: resolvedNodeParameters,
        });
    }
    recordToolExecutionStart(toolCallId, startTime) {
        if (!toolCallId)
            return;
        const entry = this.findOpenTimelineToolCall(toolCallId);
        if (entry) {
            entry.startTime = startTime;
            this.emitTimelineSnapshot();
        }
    }
    recordToolExecutionEnd(toolCallId, isError, endTime) {
        if (!toolCallId)
            return;
        const entry = this.findOpenTimelineToolCall(toolCallId);
        if (entry) {
            entry.endTime = endTime;
            entry.success = !isError;
            if (entry.childTrace)
                (0, api_types_1.settleChildTrace)(entry.childTrace);
            this.emitTimelineSnapshot();
        }
    }
    findOpenTimelineToolCall(toolCallId) {
        return [...this.timeline]
            .reverse()
            .find((e) => e.type === 'tool-call' && e.toolCallId === toolCallId && e.endTime === 0);
    }
    recordToolResult(toolCallId, name, output, isError) {
        const recordedOutput = sanitizeExecutionLogValue(isError ? normaliseToolErrorOutput(output) : output);
        const pendingTimeline = [...this.timeline]
            .reverse()
            .find((e) => e.type === 'tool-call' &&
            (toolCallId ? e.toolCallId === toolCallId : e.name === name && e.endTime === 0));
        if (pendingTimeline) {
            pendingTimeline.output = recordedOutput;
            pendingTimeline.success = !isError;
            if (pendingTimeline.endTime === 0) {
                pendingTimeline.endTime = Date.now();
            }
            if (pendingTimeline.childTrace)
                (0, api_types_1.settleChildTrace)(pendingTimeline.childTrace);
            if (pendingTimeline.kind === 'workflow' && (0, is_record_1.isRecord)(recordedOutput)) {
                const execId = recordedOutput.executionId;
                if (typeof execId === 'string') {
                    pendingTimeline.workflowExecutionId = execId;
                }
            }
            this.emitTimelineSnapshot();
            return;
        }
        this.flushReasoningBuffer();
        this.flushTextBuffer();
        const entry = this.registry.get(name);
        const now = Date.now();
        const synthesized = {
            type: 'tool-call',
            kind: entry?.kind ?? 'tool',
            name,
            toolCallId,
            input: undefined,
            output: recordedOutput,
            startTime: now,
            endTime: now,
            success: !isError,
            workflowId: entry?.workflowId,
            workflowName: entry?.workflowName,
            triggerType: entry?.triggerType,
            nodeType: entry?.nodeType,
            nodeTypeVersion: entry?.nodeTypeVersion,
            nodeDisplayName: entry?.nodeDisplayName,
            nodeParameters: entry?.nodeParameters !== undefined
                ? sanitizeExecutionLogRecord(entry.nodeParameters)
                : undefined,
        };
        if (synthesized.kind === 'workflow' && (0, is_record_1.isRecord)(recordedOutput)) {
            const execId = recordedOutput.executionId;
            if (typeof execId === 'string') {
                synthesized.workflowExecutionId = execId;
            }
        }
        this.appendCompletedEvent(synthesized);
    }
    appendCompletedEvent(event) {
        this.timeline.push(event);
        this.emitTimelineSnapshot();
    }
    emitTimelineSnapshot(activeEvent) {
        if (!this.onTimelineSnapshot)
            return;
        const timeline = activeEvent ? [...this.timeline, activeEvent] : this.timeline;
        this.onTimelineSnapshot(structuredClone(timeline));
    }
}
exports.ExecutionRecorder = ExecutionRecorder;
//# sourceMappingURL=execution-recorder.js.map