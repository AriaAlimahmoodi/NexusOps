import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
export declare function extractTextContent(message: AIMessage): string | null;
export declare function extractThinkingContent(message: AIMessage): string | null;
export declare function pushValidationFeedback(messages: BaseMessage[], content: string): void;
