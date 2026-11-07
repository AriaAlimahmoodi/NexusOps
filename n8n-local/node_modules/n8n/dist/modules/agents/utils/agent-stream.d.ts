import type { StreamChunk } from '@n8n/agents';
export declare function streamAgentChunks(stream: ReadableStream<StreamChunk>): AsyncGenerator<StreamChunk>;
