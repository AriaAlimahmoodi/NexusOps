import type { StreamChunk } from '@n8n/agents';
import type { Thread } from 'chat';
import { type Logger } from 'n8n-workflow';
import type { AgentExecutionStreamChunk } from '../types/agent-steering';
import type { BridgeStatusHandle } from './agent-chat-integration';
type SuspendedChunk = Extract<StreamChunk, {
    type: 'tool-call-suspended';
}>;
type MessageChunk = Extract<StreamChunk, {
    type: 'message';
}>;
export type SuspensionHandlingResult = 'posted' | 'skipped' | 'failed';
interface AgentChatStreamConsumerOptions {
    disableStreaming: boolean;
    logger: Logger;
    postErrorToThread: (thread: Thread<unknown, unknown> | null, error: unknown, throwOnDeliveryError?: boolean) => Promise<void>;
    handleSuspension: (chunk: SuspendedChunk, thread: Thread<unknown, unknown>, actingUserId?: string) => Promise<SuspensionHandlingResult>;
    handleMessage: (chunk: MessageChunk, thread: Thread<unknown, unknown>, throwOnDeliveryError?: boolean) => Promise<boolean>;
    isIntegrationActionTool?: (toolName: string) => boolean;
    singleStreamedRunPerTurn?: boolean;
}
interface ConsumeStreamOptions {
    forceBuffered?: boolean;
    throwOnDeliveryError?: boolean;
    statusHandle?: BridgeStatusHandle;
    actingUserId?: string;
    quietErrors?: boolean;
}
export declare class AgentChatStreamConsumer {
    private readonly options;
    constructor(options: AgentChatStreamConsumerOptions);
    consume(stream: AsyncGenerator<AgentExecutionStreamChunk>, thread: Thread<unknown, unknown>, options?: ConsumeStreamOptions): Promise<void>;
    private separateTextSteps;
    private postBufferedText;
    private postBudgetStop;
    private postError;
    private noteToolResult;
    private isSilentOutcome;
    private createResponseLifecycle;
    private postFallbackIfNeeded;
    private consumeBuffered;
}
export {};
