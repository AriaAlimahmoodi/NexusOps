import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { RunnableConfig } from '@langchain/core/runnables';
export declare function workflowNameChain(llm: BaseChatModel, initialPrompt: string, config?: RunnableConfig): Promise<{
    name: string;
}>;
