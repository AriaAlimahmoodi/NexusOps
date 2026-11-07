import type { BaseMessage } from '@langchain/core/messages';
import { RemoveMessage } from '@langchain/core/messages';
export declare function cleanupDanglingToolCallMessages(messages: BaseMessage[]): RemoveMessage[];
