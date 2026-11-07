import type { Message, Thread } from 'chat';
import type { BridgeExecutionContext, BridgeMessageContextParams, BridgeResumeExecutionContext, PlatformAgentContext } from '../../agent-chat-integration';
import type { ChatInstance } from '../../chat-integration.service';
import type { ReplyExpectation } from '../../integration-tools';
export interface SlackThreadContext {
    channelId: string;
    threadTs: string;
    hasRealThreadTs: boolean;
    canUseThreadTs: boolean;
    recipientTeamId?: string;
}
export declare function getSlackPlatformAgentContext(chat: ChatInstance): PlatformAgentContext;
export declare function getSlackReplyExpectation(params: {
    message: Message<unknown>;
    isNewMention: boolean;
}): ReplyExpectation;
export declare function prepareSlackInboundText(text: string, context: PlatformAgentContext): string;
export declare function createSlackBridgeExecutionContext(params: BridgeMessageContextParams): Promise<BridgeExecutionContext>;
export declare function createSlackResumeExecutionContext(params: {
    chat: ChatInstance;
    thread: Thread<unknown, unknown>;
    logger: BridgeMessageContextParams['logger'];
    agentId: string;
    slackThreadContext?: SlackThreadContext;
}): Promise<BridgeResumeExecutionContext>;
