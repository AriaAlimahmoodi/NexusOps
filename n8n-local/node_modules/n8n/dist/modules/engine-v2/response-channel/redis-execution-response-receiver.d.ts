import type { Logger } from '@n8n/backend-common';
import type { ExecutionResponse } from '@n8n/engine';
import type { ExecutionResponseReceiver, UnsubscribeExecutionResponse } from './execution-response-receiver';
import type { RedisExecutionResponseChannelNameGenerator } from './redis-execution-response-channel';
type RedisMessageHandler = (channel: string, message: string) => void;
type RedisConnectionHandler = () => void;
export interface RedisResponseSubscriber {
    subscribe(...channels: string[]): Promise<unknown>;
    unsubscribe(channel: string): Promise<unknown>;
    on(event: 'close' | 'ready', handler: RedisConnectionHandler): unknown;
    on(event: 'message', handler: RedisMessageHandler): unknown;
    off(event: 'close' | 'ready', handler: RedisConnectionHandler): unknown;
    off(event: 'message', handler: RedisMessageHandler): unknown;
    disconnect(): void;
}
export declare class RedisExecutionResponseReceiver implements ExecutionResponseReceiver {
    private readonly subscriber;
    private readonly getChannelName;
    private readonly logger;
    private readonly subscriptionsByChannel;
    private started;
    private stopped;
    private lostConnection;
    constructor(subscriber: RedisResponseSubscriber, getChannelName: RedisExecutionResponseChannelNameGenerator, logger: Logger);
    start(): Promise<void>;
    receive(executionId: string, handler: (response: ExecutionResponse) => void): Promise<UnsubscribeExecutionResponse>;
    private unsubscribeHandler;
    stop(): Promise<void>;
    private readonly handleClose;
    private readonly handleReady;
    private resubscribe;
    private readonly handleMessage;
}
export {};
