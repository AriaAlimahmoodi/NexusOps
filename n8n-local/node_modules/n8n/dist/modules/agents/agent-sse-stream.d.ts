import type { AgentSseEvent } from '@n8n/api-types';
import type { Response } from 'express';
import type { AgentExecutionStreamChunk } from './types/agent-steering';
export type FlushableResponse = Response & {
    flush?: () => void;
};
export declare function initSseStream(res: FlushableResponse): {
    send: (event: AgentSseEvent) => void;
    onChunk: (chunk: AgentExecutionStreamChunk) => void;
    abortSignal: AbortSignal;
    close: () => void;
};
export declare function toChatErrorEvent(error: unknown, fallbackMessage: string): AgentSseEvent;
export declare function emitChunkEvents(chunk: AgentExecutionStreamChunk, send: (event: AgentSseEvent) => void): void;
