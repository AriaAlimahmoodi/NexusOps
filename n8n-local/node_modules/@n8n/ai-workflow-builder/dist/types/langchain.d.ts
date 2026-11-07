import type { AIMessage, BaseMessage } from '@langchain/core/messages';
export declare function isAIMessage(msg: BaseMessage): msg is AIMessage;
export declare function isBaseMessage(value: unknown): value is BaseMessage;
