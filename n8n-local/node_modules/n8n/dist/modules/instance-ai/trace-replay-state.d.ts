import type { InstanceAiTraceContext } from '@n8n/instance-ai';
export declare class TraceReplayState {
    private eventsBySlug;
    private activeSlug;
    private sharedTraceIndex?;
    private sharedIdRemapper?;
    private sharedTraceSlug?;
    private sharedTraceWriter?;
    private sharedTraceWriterSlug?;
    getActiveSlug(): string | undefined;
    loadEvents(slug: string, events: unknown[]): void;
    getEvents(slug: string): unknown[];
    activateSlug(slug: string): void;
    clearEvents(slug: string): void;
    preserveWriterEvents(slug: string, writerEvents: unknown[]): void;
    getEventsWithWriterFallback(slug: string, activeWriterEntries: Iterable<{
        traceSlug?: string;
        tracing: InstanceAiTraceContext;
    }>): unknown[];
    configureReplayMode(tracing: InstanceAiTraceContext): Promise<void>;
}
