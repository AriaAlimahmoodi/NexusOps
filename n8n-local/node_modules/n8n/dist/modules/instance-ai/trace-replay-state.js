"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceReplayState = void 0;
const lazy_import_1 = require("@n8n/utils/lazy-import");
const TOOL_TRACE_EVENT_KINDS = new Set(['tool-call', 'tool-suspend', 'tool-resume']);
function getTraceEventKind(event) {
    if (typeof event !== 'object' || event === null || Array.isArray(event))
        return undefined;
    const kind = Reflect.get(event, 'kind');
    return typeof kind === 'string' ? kind : undefined;
}
function isHeaderTraceEvent(event) {
    return getTraceEventKind(event) === 'header';
}
function isToolTraceEvent(event) {
    const kind = getTraceEventKind(event);
    return kind !== undefined && TOOL_TRACE_EVENT_KINDS.has(kind);
}
function hasToolTraceEvents(events) {
    return events?.some(isToolTraceEvent) ?? false;
}
function mergeTraceEvents(...eventLists) {
    const merged = [];
    let hasHeader = false;
    const seenToolEvents = new Set();
    for (const events of eventLists) {
        for (const event of events) {
            if (isHeaderTraceEvent(event)) {
                if (hasHeader)
                    continue;
                hasHeader = true;
            }
            if (isToolTraceEvent(event)) {
                const key = JSON.stringify(event);
                if (seenToolEvents.has(key))
                    continue;
                seenToolEvents.add(key);
            }
            merged.push(event);
        }
    }
    return merged;
}
class TraceReplayState {
    constructor() {
        this.eventsBySlug = new Map();
    }
    getActiveSlug() {
        return this.activeSlug;
    }
    loadEvents(slug, events) {
        this.eventsBySlug.set(slug, events);
        this.activeSlug = slug;
    }
    getEvents(slug) {
        return this.eventsBySlug.get(slug) ?? [];
    }
    activateSlug(slug) {
        this.activeSlug = slug;
    }
    clearEvents(slug) {
        this.eventsBySlug.delete(slug);
        if (this.activeSlug === slug) {
            this.activeSlug = undefined;
        }
        if (this.sharedTraceSlug === slug) {
            this.sharedTraceIndex = undefined;
            this.sharedIdRemapper = undefined;
            this.sharedTraceSlug = undefined;
        }
        if (this.sharedTraceWriterSlug === slug) {
            this.sharedTraceWriter = undefined;
            this.sharedTraceWriterSlug = undefined;
        }
    }
    preserveWriterEvents(slug, writerEvents) {
        const existing = this.eventsBySlug.get(slug) ?? [];
        existing.push(...writerEvents);
        this.eventsBySlug.set(slug, existing);
    }
    getEventsWithWriterFallback(slug, activeWriterEntries) {
        const fromWriters = [];
        for (const entry of activeWriterEntries) {
            if ((entry.traceSlug === slug || entry.traceSlug === undefined) &&
                entry.tracing.traceWriter) {
                fromWriters.push(...entry.tracing.traceWriter.getEvents());
            }
        }
        const preserved = this.eventsBySlug.get(slug) ?? [];
        const merged = mergeTraceEvents(preserved, fromWriters);
        if (hasToolTraceEvents(merged))
            return merged;
        return fromWriters.length > 0 ? merged : preserved;
    }
    async configureReplayMode(tracing) {
        if (process.env.E2E_TESTS !== 'true') {
            return;
        }
        const { TraceIndex: TI, IdRemapper: IR, TraceWriter: TW, } = await (0, lazy_import_1.lazyImport)(async () => await import('@n8n/instance-ai'));
        const slug = this.activeSlug;
        const events = slug ? this.eventsBySlug.get(slug) : undefined;
        if (hasToolTraceEvents(events)) {
            if (this.sharedTraceSlug !== slug || !this.sharedTraceIndex) {
                this.sharedTraceIndex = new TI(events);
                this.sharedIdRemapper = new IR();
                this.sharedTraceSlug = slug;
            }
            tracing.replayMode = 'replay';
            tracing.traceIndex = this.sharedTraceIndex;
            tracing.idRemapper = this.sharedIdRemapper;
        }
        else {
            if (this.sharedTraceWriterSlug !== slug || !this.sharedTraceWriter) {
                this.sharedTraceWriter = new TW('recording');
                this.sharedTraceWriterSlug = slug;
            }
            tracing.replayMode = 'record';
            tracing.traceWriter = this.sharedTraceWriter;
        }
    }
}
exports.TraceReplayState = TraceReplayState;
//# sourceMappingURL=trace-replay-state.js.map