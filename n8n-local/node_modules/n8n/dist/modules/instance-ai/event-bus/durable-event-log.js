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
exports.DurableEventLog = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const durable_log_metrics_1 = require("./durable-log-metrics");
const instance_ai_event_log_repository_1 = require("../repositories/instance-ai-event-log.repository");
const EPHEMERAL_TYPES = api_types_1.INSTANCE_AI_EPHEMERAL_EVENT_TYPES;
const MAX_APPEND_ATTEMPTS = 5;
const IDLE_FLUSH_MS = 3_000;
function isFlushMarker(entry) {
    return 'flushSignal' in entry;
}
function serializedBytes(events) {
    return events.reduce((total, event) => total + Buffer.byteLength(JSON.stringify(event), 'utf8'), 0);
}
let DurableEventLog = class DurableEventLog {
    constructor(logger, repo, metrics) {
        this.logger = logger;
        this.repo = repo;
        this.metrics = metrics;
        this.pendingByThread = new Map();
        this.draining = new Map();
        this.lastSeq = new Map();
        this.buffers = new Map();
        this.emitters = new Map();
        this.activityByThread = new Map();
        this.lifecycles = new Map();
        this.idleFlushTimers = new Map();
        this.idleFlushMs = IDLE_FLUSH_MS;
        this.logger = this.logger.scoped('instance-ai');
    }
    publish(threadId, event, emit) {
        this.emitters.set(threadId, emit);
        const pending = this.pendingByThread.get(threadId);
        const entry = { event, enqueuedAt: Date.now() };
        if (pending)
            pending.push(entry);
        else
            this.pendingByThread.set(threadId, [entry]);
        this.ensureDraining(threadId);
        this.scheduleIdleFlush(threadId);
    }
    scheduleIdleFlush(threadId) {
        const existing = this.idleFlushTimers.get(threadId);
        if (existing)
            clearTimeout(existing);
        const timer = setTimeout(() => {
            this.idleFlushTimers.delete(threadId);
            void this.settleIdleThread(threadId).catch((error) => {
                this.logger.error('Instance AI event log idle flush failed', { threadId, error });
            });
        }, this.idleFlushMs);
        timer.unref();
        this.idleFlushTimers.set(threadId, timer);
    }
    async settleIdleThread(threadId) {
        await this.flush(threadId);
        await this.draining.get(threadId);
        if (this.idleFlushTimers.has(threadId))
            return;
        if (this.pendingByThread.has(threadId) ||
            this.draining.has(threadId) ||
            (this.buffers.get(threadId)?.size ?? 0) > 0) {
            this.scheduleIdleFlush(threadId);
            return;
        }
        this.buffers.delete(threadId);
        this.activityByThread.delete(threadId);
        this.lastSeq.delete(threadId);
        this.emitters.delete(threadId);
        this.lifecycles.delete(threadId);
    }
    retainedThreadCount() {
        return new Set([
            ...this.pendingByThread.keys(),
            ...this.draining.keys(),
            ...this.lastSeq.keys(),
            ...this.buffers.keys(),
            ...this.activityByThread.keys(),
            ...this.emitters.keys(),
            ...this.lifecycles.keys(),
            ...this.idleFlushTimers.keys(),
        ]).size;
    }
    async getEventsAfter(threadId, afterSeq) {
        return await this.repo.getAfter(threadId, afterSeq);
    }
    async getEventsForRuns(threadId, runIds) {
        return await this.repo.getForRuns(threadId, runIds);
    }
    async getSetupItemsSnapshots(threadId) {
        await this.flush(threadId);
        return await this.repo.getSetupItemsSnapshots(threadId);
    }
    async getLastPreferencesInjectionRunId(threadId) {
        await this.flush(threadId);
        return await this.repo.getLastPreferencesInjectionRunId(threadId);
    }
    async getLastAppliedPreferences(threadId) {
        return await this.repo.getLastAppliedPreferences(threadId);
    }
    getOpenSegments(threadId) {
        const threadBuffers = this.buffers.get(threadId);
        if (!threadBuffers)
            return [];
        const segments = [];
        for (const [key, buffer] of threadBuffers) {
            const separator = key.indexOf(':');
            const runId = key.slice(0, separator);
            const agentId = key.slice(separator + 1);
            for (const kind of ['reasoning', 'text']) {
                const parts = kind === 'text' ? buffer.text : buffer.reasoning;
                const unemitted = kind === 'text' ? buffer.textUnemittedParts : buffer.reasoningUnemittedParts;
                const emitted = unemitted > 0 ? parts.slice(0, parts.length - unemitted) : parts;
                if (emitted.length === 0)
                    continue;
                const responseId = kind === 'text' ? buffer.textResponseId : buffer.reasoningResponseId;
                segments.push({ runId, agentId, kind, responseId, text: emitted.join('') });
            }
        }
        return segments;
    }
    async getNextEventId(threadId) {
        return (await this.repo.maxSeq(threadId)) + 1;
    }
    clearThread(threadId) {
        this.resolvePendingFlushes(threadId);
        this.pendingByThread.delete(threadId);
        this.lastSeq.delete(threadId);
        this.buffers.delete(threadId);
        this.activityByThread.delete(threadId);
        this.emitters.delete(threadId);
        this.lifecycles.delete(threadId);
        const timer = this.idleFlushTimers.get(threadId);
        if (timer)
            clearTimeout(timer);
        this.idleFlushTimers.delete(threadId);
    }
    clear() {
        for (const threadId of this.pendingByThread.keys())
            this.resolvePendingFlushes(threadId);
        this.pendingByThread.clear();
        this.lastSeq.clear();
        this.buffers.clear();
        this.activityByThread.clear();
        this.emitters.clear();
        this.lifecycles.clear();
        for (const timer of this.idleFlushTimers.values())
            clearTimeout(timer);
        this.idleFlushTimers.clear();
    }
    resolvePendingFlushes(threadId) {
        const pending = this.pendingByThread.get(threadId);
        if (!pending)
            return;
        for (const entry of pending) {
            if (isFlushMarker(entry))
                entry.flushSignal.resolve();
        }
    }
    async flush(threadId) {
        const hasBuffers = (this.buffers.get(threadId)?.size ?? 0) > 0;
        if (!this.pendingByThread.has(threadId) && !this.draining.has(threadId) && !hasBuffers) {
            return;
        }
        await new Promise((resolve) => {
            const entry = { flushSignal: { resolve } };
            const pending = this.pendingByThread.get(threadId);
            if (pending)
                pending.push(entry);
            else
                this.pendingByThread.set(threadId, [entry]);
            this.ensureDraining(threadId);
        });
    }
    async flushAll() {
        const threadIds = new Set([
            ...this.draining.keys(),
            ...this.buffers.keys(),
            ...this.pendingByThread.keys(),
        ]);
        for (const threadId of threadIds) {
            try {
                await this.flush(threadId);
            }
            catch (error) {
                this.logger.error('Failed to flush Instance AI event log on shutdown', {
                    threadId,
                    error,
                });
            }
        }
    }
    ensureDraining(threadId) {
        if (this.draining.has(threadId))
            return;
        const drain = (async () => {
            try {
                let batch = this.takePending(threadId);
                while (batch.length > 0) {
                    try {
                        await this.drainBatch(threadId, batch);
                    }
                    catch (error) {
                        this.logger.error('Instance AI event log drain failed for a batch', {
                            threadId,
                            error,
                        });
                        for (const entry of batch) {
                            if (isFlushMarker(entry))
                                entry.flushSignal.resolve();
                        }
                    }
                    batch = this.takePending(threadId);
                }
            }
            finally {
                this.draining.delete(threadId);
            }
        })();
        this.draining.set(threadId, drain);
    }
    async drainBatch(threadId, batch) {
        const lifecycle = this.currentLifecycle(threadId);
        const flushSignals = [];
        const settleFlushes = () => {
            for (const signal of flushSignals)
                signal.resolve();
        };
        const emit = this.emitters.get(threadId);
        if (!emit) {
            for (const entry of batch) {
                if (isFlushMarker(entry))
                    entry.flushSignal.resolve();
            }
            return;
        }
        const toPersist = [];
        const toEmit = [];
        const activity = this.activityByThread.get(threadId) ?? (0, api_types_1.createInstanceAiEventLifecycle)();
        this.activityByThread.set(threadId, activity);
        for (const entry of batch) {
            if (isFlushMarker(entry)) {
                for (const block of this.takeAllOpenBlocks(threadId)) {
                    toEmit.push({ event: block, persistIndex: toPersist.length, live: false });
                    toPersist.push(block);
                }
                flushSignals.push(entry.flushSignal);
                continue;
            }
            const { event } = entry;
            if (!(0, api_types_1.acceptInstanceAiEvent)(activity, event))
                continue;
            if (EPHEMERAL_TYPES.has(event.type)) {
                for (const rolled of this.rollSegmentOnResponseChange(threadId, event)) {
                    toEmit.push({ event: rolled, persistIndex: toPersist.length, live: false });
                    toPersist.push(rolled);
                }
                this.bufferDelta(threadId, event);
                toEmit.push({ event, live: true });
                continue;
            }
            for (const block of this.flushBlocks(threadId, event)) {
                toEmit.push({ event: block, persistIndex: toPersist.length, live: false });
                toPersist.push(block);
            }
            toEmit.push({ event, persistIndex: toPersist.length, live: true });
            toPersist.push(event);
        }
        let firstSeq;
        let admitted = toEmit;
        if (toPersist.length > 0) {
            const persisted = await this.persistWithRetry(threadId, toEmit, lifecycle);
            firstSeq = persisted.firstSeq;
            admitted = persisted.entries;
            if (this.lifecycles.get(threadId) !== lifecycle) {
                settleFlushes();
                return;
            }
            const persistedAt = Date.now();
            for (const entry of batch) {
                if (!isFlushMarker(entry))
                    this.metrics.recordQueueLatency(persistedAt - entry.enqueuedAt);
            }
        }
        for (const drained of admitted) {
            const id = drained.persistIndex !== undefined && firstSeq !== undefined
                ? firstSeq + drained.persistIndex
                : undefined;
            emit({ ...(id !== undefined ? { id } : {}), event: drained.event, live: drained.live });
        }
        this.markBufferedPartsEmitted(threadId);
        settleFlushes();
    }
    currentLifecycle(threadId) {
        let token = this.lifecycles.get(threadId);
        if (!token) {
            token = {};
            this.lifecycles.set(threadId, token);
        }
        return token;
    }
    takeAllOpenBlocks(threadId) {
        const threadBuffers = this.buffers.get(threadId);
        if (!threadBuffers || threadBuffers.size === 0)
            return [];
        const blocks = [];
        for (const [key, buffer] of threadBuffers) {
            const separator = key.indexOf(':');
            const runId = key.slice(0, separator);
            const agentId = key.slice(separator + 1);
            const reasoning = this.takeBlock('reasoning', runId, agentId, buffer);
            if (reasoning)
                blocks.push(reasoning);
            const text = this.takeBlock('text', runId, agentId, buffer);
            if (text)
                blocks.push(text);
        }
        this.buffers.delete(threadId);
        return blocks;
    }
    async persistWithRetry(threadId, entries, lifecycle) {
        let lastError;
        let attemptedFirstSeq;
        let admitted = entries;
        let events = entries
            .filter((entry) => entry.persistIndex !== undefined)
            .map((entry) => entry.event);
        for (let attempt = 1; attempt <= MAX_APPEND_ATTEMPTS; attempt++) {
            if (this.lifecycles.get(threadId) !== lifecycle) {
                this.logger.debug('Instance AI event log dropped a batch for a cleared thread', {
                    threadId,
                    events: events.length,
                });
                return { entries: [] };
            }
            let firstSeq;
            try {
                if (attemptedFirstSeq !== undefined) {
                    const payload = await this.repo.payloadAt(threadId, attemptedFirstSeq);
                    if (this.lifecycles.get(threadId) !== lifecycle)
                        return { entries: [] };
                    if (payload === JSON.stringify(events[0])) {
                        this.lastSeq.set(threadId, attemptedFirstSeq + events.length - 1);
                        this.metrics.recordDrainBatch(events.length, serializedBytes(events));
                        return { firstSeq: attemptedFirstSeq, entries: admitted };
                    }
                    attemptedFirstSeq = undefined;
                }
                firstSeq = (await this.currentSeq(threadId)) + 1;
                const activity = (0, api_types_1.createInstanceAiEventLifecycle)();
                const runIds = [...new Set(entries.map((entry) => entry.event.runId))];
                for (const event of await this.repo.getActivityTerminalEvents(threadId, runIds)) {
                    (0, api_types_1.acceptInstanceAiEvent)(activity, event);
                }
                admitted = [];
                events = [];
                for (const entry of entries) {
                    if (!(0, api_types_1.acceptInstanceAiEvent)(activity, entry.event))
                        continue;
                    if (entry.persistIndex === undefined)
                        admitted.push(entry);
                    else {
                        admitted.push({ ...entry, persistIndex: events.length });
                        events.push(entry.event);
                    }
                }
                if (this.lifecycles.get(threadId) !== lifecycle)
                    return { entries: [] };
                const cached = this.activityByThread.get(threadId);
                if (cached) {
                    Object.assign(cached.closedRuns, activity.closedRuns);
                    for (const [runId, agents] of Object.entries(activity.closedAgents)) {
                        Object.assign((cached.closedAgents[runId] ??= {}), agents);
                    }
                }
                if (events.length === 0)
                    return { entries: admitted };
                attemptedFirstSeq = firstSeq;
                const bytes = await this.repo.appendBatch(threadId, firstSeq, events);
                this.lastSeq.set(threadId, firstSeq + events.length - 1);
                this.metrics.recordDrainBatch(events.length, bytes);
                return { firstSeq, entries: admitted };
            }
            catch (error) {
                lastError = error;
                if ((0, db_1.isUniqueConstraintError)(error)) {
                    attemptedFirstSeq = undefined;
                    this.lastSeq.delete(threadId);
                    this.metrics.recordAppendConflict(attempt);
                    this.logger.warn('Instance AI event log append conflict, retrying', {
                        threadId,
                        attempt,
                        error,
                    });
                    continue;
                }
                if (firstSeq !== undefined && (await this.didBatchCommit(threadId, firstSeq, events))) {
                    this.lastSeq.set(threadId, firstSeq + events.length - 1);
                    this.metrics.recordDrainBatch(events.length, serializedBytes(events));
                    return { firstSeq, entries: admitted };
                }
                this.lastSeq.delete(threadId);
                this.logger.warn('Instance AI event log append failed, retrying', {
                    threadId,
                    attempt,
                    error,
                });
            }
        }
        this.metrics.recordAppendFailure(events.length);
        this.logger.error('Instance AI event log append failed, dropping batch', {
            threadId,
            events: events.length,
            error: lastError,
        });
        return { entries: admitted };
    }
    async didBatchCommit(threadId, firstSeq, events) {
        try {
            const payload = await this.repo.payloadAt(threadId, firstSeq);
            return payload !== null && payload === JSON.stringify(events[0]);
        }
        catch {
            return false;
        }
    }
    bufferDelta(threadId, event) {
        if (event.type !== 'text-delta' && event.type !== 'reasoning-delta')
            return;
        if (!event.responseId) {
            this.logger.debug('Instance AI durable log buffered a delta without a responseId', {
                threadId,
                runId: event.runId,
                agentId: event.agentId,
            });
        }
        const buffer = this.getOrCreateBuffer(threadId, `${event.runId}:${event.agentId}`);
        if (event.type === 'text-delta') {
            buffer.text.push(event.payload.text);
            buffer.textUnemittedParts++;
            buffer.textResponseId = event.responseId ?? buffer.textResponseId;
        }
        else {
            buffer.reasoning.push(event.payload.text);
            buffer.reasoningUnemittedParts++;
            buffer.reasoningResponseId = event.responseId ?? buffer.reasoningResponseId;
        }
    }
    markBufferedPartsEmitted(threadId) {
        const threadBuffers = this.buffers.get(threadId);
        if (!threadBuffers)
            return;
        for (const buffer of threadBuffers.values()) {
            buffer.textUnemittedParts = 0;
            buffer.reasoningUnemittedParts = 0;
        }
    }
    flushBlocks(threadId, fact) {
        const threadBuffers = this.buffers.get(threadId);
        if (!threadBuffers)
            return [];
        const keys = fact.type === 'run-finish'
            ? [...threadBuffers.keys()].filter((k) => k.startsWith(`${fact.runId}:`))
            : [`${fact.runId}:${fact.agentId}`];
        const flushed = [];
        for (const key of keys) {
            const buffer = threadBuffers.get(key);
            if (!buffer)
                continue;
            threadBuffers.delete(key);
            const agentId = key.slice(fact.runId.length + 1);
            const reasoning = this.takeBlock('reasoning', fact.runId, agentId, buffer);
            if (reasoning)
                flushed.push(reasoning);
            const text = this.takeBlock('text', fact.runId, agentId, buffer);
            if (text)
                flushed.push(text);
        }
        if (threadBuffers.size === 0)
            this.buffers.delete(threadId);
        return flushed;
    }
    rollSegmentOnResponseChange(threadId, event) {
        if (event.type !== 'text-delta' && event.type !== 'reasoning-delta')
            return [];
        const buffer = this.buffers.get(threadId)?.get(`${event.runId}:${event.agentId}`);
        if (!buffer)
            return [];
        const kind = event.type === 'text-delta' ? 'text' : 'reasoning';
        const openResponseId = kind === 'text' ? buffer.textResponseId : buffer.reasoningResponseId;
        const hasContent = (kind === 'text' ? buffer.text : buffer.reasoning).length > 0;
        if (!hasContent || openResponseId === event.responseId)
            return [];
        const block = this.takeBlock(kind, event.runId, event.agentId, buffer);
        return block ? [block] : [];
    }
    takeBlock(kind, runId, agentId, buffer) {
        const parts = kind === 'text' ? buffer.text : buffer.reasoning;
        if (parts.length === 0)
            return undefined;
        const text = parts.join('');
        if (kind === 'text') {
            const responseId = buffer.textResponseId;
            buffer.text = [];
            buffer.textUnemittedParts = 0;
            buffer.textResponseId = undefined;
            return {
                type: 'text-block',
                runId,
                agentId,
                ...(responseId ? { responseId } : {}),
                payload: { text },
            };
        }
        const responseId = buffer.reasoningResponseId;
        buffer.reasoning = [];
        buffer.reasoningUnemittedParts = 0;
        buffer.reasoningResponseId = undefined;
        return {
            type: 'reasoning-block',
            runId,
            agentId,
            ...(responseId ? { responseId } : {}),
            payload: { text },
        };
    }
    async currentSeq(threadId) {
        const cached = this.lastSeq.get(threadId);
        if (cached !== undefined)
            return cached;
        const max = await this.repo.maxSeq(threadId);
        this.lastSeq.set(threadId, max);
        return max;
    }
    getOrCreateBuffer(threadId, key) {
        let threadBuffers = this.buffers.get(threadId);
        if (!threadBuffers) {
            threadBuffers = new Map();
            this.buffers.set(threadId, threadBuffers);
        }
        let buffer = threadBuffers.get(key);
        if (!buffer) {
            buffer = { text: [], reasoning: [], textUnemittedParts: 0, reasoningUnemittedParts: 0 };
            threadBuffers.set(key, buffer);
        }
        return buffer;
    }
    takePending(threadId) {
        const pending = this.pendingByThread.get(threadId);
        if (!pending)
            return [];
        this.pendingByThread.delete(threadId);
        return pending;
    }
};
exports.DurableEventLog = DurableEventLog;
exports.DurableEventLog = DurableEventLog = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_ai_event_log_repository_1.InstanceAiEventLogRepository, durable_log_metrics_1.DurableLogMetrics])
], DurableEventLog);
//# sourceMappingURL=durable-event-log.js.map