import type { Thread } from 'chat';
import type { BridgeMessageContextParams, BridgeStatusHandle } from '../agent-chat-integration';
export interface TypingIndicatorOptions {
    logger: BridgeMessageContextParams['logger'];
    agentId: string;
    platform: string;
    refreshMs: number;
}
export declare function startTypingIndicator(thread: Thread<unknown, unknown>, options: TypingIndicatorOptions): BridgeStatusHandle;
