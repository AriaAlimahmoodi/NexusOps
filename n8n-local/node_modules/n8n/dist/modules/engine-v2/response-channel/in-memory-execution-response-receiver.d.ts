import type { Logger } from '@n8n/backend-common';
import type { ExecutionResponse } from '@n8n/engine';
import type { ExecutionResponseReceiver, UnsubscribeExecutionResponse } from './execution-response-receiver';
import type { InMemoryExecutionResponseChannel } from './in-memory-execution-response-channel';
export declare class InMemoryExecutionResponseReceiver implements ExecutionResponseReceiver {
    private readonly channel;
    private readonly logger;
    private readonly subscriptions;
    private stopped;
    constructor(channel: InMemoryExecutionResponseChannel, logger: Logger);
    receive(executionId: string, handler: (response: ExecutionResponse) => void): Promise<UnsubscribeExecutionResponse>;
    stop(): Promise<void>;
}
