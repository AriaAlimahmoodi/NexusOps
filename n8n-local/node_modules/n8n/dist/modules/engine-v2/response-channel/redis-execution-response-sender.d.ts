import type { Logger } from '@n8n/backend-common';
import type { ExecutionResponse, ExecutionResponseSender } from '@n8n/engine';
import { type Result } from '@n8n/utils/result';
import type { RedisExecutionResponseChannelNameGenerator } from './redis-execution-response-channel';
export declare const SHUTDOWN_DRAIN_TIMEOUT_MS = 5000;
export interface RedisResponsePublisher {
    publish(channel: string, message: string): Promise<unknown>;
    disconnect(): void;
}
export declare class RedisExecutionResponseSender implements ExecutionResponseSender {
    private readonly publisher;
    private readonly getChannelName;
    private readonly logger;
    private stopped;
    private readonly inFlightPublishes;
    constructor(publisher: RedisResponsePublisher, getChannelName: RedisExecutionResponseChannelNameGenerator, logger: Logger);
    send(response: ExecutionResponse): Result<void, Error>;
    stop(): Promise<void>;
    private drainInFlightPublishes;
}
