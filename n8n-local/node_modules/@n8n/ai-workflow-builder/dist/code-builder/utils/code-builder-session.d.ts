import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MemorySaver } from '@langchain/langgraph';
export type ConversationEntry = {
    type: 'build-request';
    message: string;
} | {
    type: 'assistant-exchange';
    userQuery: string;
    assistantSummary: string;
} | {
    type: 'plan';
    userQuery: string;
    plan: string;
};
export declare function entryToString(entry: ConversationEntry): string;
export interface CodeBuilderSession {
    conversationEntries: ConversationEntry[];
    previousSummary?: string;
    sdkSessionId?: string;
}
export declare function loadCodeBuilderSession(checkpointer: MemorySaver, threadId: string): Promise<CodeBuilderSession>;
export declare function saveCodeBuilderSession(checkpointer: MemorySaver, threadId: string, session: CodeBuilderSession): Promise<void>;
export declare function compactSessionIfNeeded(session: CodeBuilderSession, llm: BaseChatModel, maxMessages?: number): Promise<CodeBuilderSession>;
export declare function generateCodeBuilderThreadId(workflowId: string, userId: string): string;
export declare function saveSessionMessages(checkpointer: MemorySaver, workflowId: string, userId: string, messages: unknown[], versionId?: string, userMessageId?: string): Promise<void>;
