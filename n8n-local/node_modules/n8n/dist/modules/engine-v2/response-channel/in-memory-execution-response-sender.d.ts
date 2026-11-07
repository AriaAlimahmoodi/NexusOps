import type { Logger } from '@n8n/backend-common';
import type { ExecutionResponse, ExecutionResponseSender } from '@n8n/engine';
import { type Result } from '@n8n/utils/result';
import type { InMemoryExecutionResponseChannel } from './in-memory-execution-response-channel';
export declare class InMemoryExecutionResponseSender implements ExecutionResponseSender {
    private readonly channel;
    private readonly logger;
    private readonly maxFrameBytes?;
    private stopped;
    constructor(channel: InMemoryExecutionResponseChannel, logger: Logger, maxFrameBytes?: number | undefined);
    send(response: ExecutionResponse): Result<void, Error>;
    stop(): Promise<void>;
}
