import type { Thread } from 'chat';
import type { BridgeExecutionContext, BridgeMessageContextParams, BridgeResumeExecutionContext, BridgeStatusHandle } from '../agent-chat-integration';
import type { IntegrationPlatformMessageContext } from '../integration-tools';
export declare function createTelegramBridgeExecutionContext(params: BridgeMessageContextParams): BridgeExecutionContext;
export declare function getTelegramPlatformMessageContext(message: BridgeMessageContextParams['message']): IntegrationPlatformMessageContext | undefined;
export declare function createTelegramResumeExecutionContext(params: {
    thread: Thread<unknown, unknown>;
    logger: BridgeMessageContextParams['logger'];
    agentId: string;
}): BridgeResumeExecutionContext;
export declare function startTelegramTypingIndicator(thread: Thread<unknown, unknown>, options: {
    logger: BridgeMessageContextParams['logger'];
    agentId: string;
}): BridgeStatusHandle;
