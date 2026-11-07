import type { StreamChunk } from '@n8n/agents';
export declare function createAttributionTracker(attributions: Map<string, string>): {
    observe(chunk: StreamChunk): StreamChunk[];
};
