import type { JsonValue } from '@n8n/engine';
import { type ResponseStream } from '../../../webhooks/streaming-webhook-response-heartbeat';
import type { WebhookRunOutcome } from './webhook-outcome';
export declare class StreamingResponseWriter {
    private readonly stream;
    private deliveredError;
    private stopped;
    private readonly heartbeat;
    constructor(stream: ResponseStream);
    writeChunk(payload: JsonValue): void;
    finish(outcome: WebhookRunOutcome): void;
    stop(): void;
    private write;
    private errorChunk;
}
