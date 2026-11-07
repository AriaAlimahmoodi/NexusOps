import type { BaseMessage } from '@langchain/core/messages';
import type { Tool } from '@langchain/core/tools';
import type { OpenAIClient } from '@langchain/openai';
import type { BufferWindowMemory } from '@langchain/classic/memory';
export declare function formatToOpenAIFunction(tool: Tool): OpenAIClient.Chat.ChatCompletionCreateParams.Function;
export declare function formatToOpenAITool(tool: Tool): OpenAIClient.Chat.ChatCompletionTool;
export declare function formatToOpenAIAssistantTool(tool: Tool): OpenAIClient.Beta.AssistantTool;
export declare function formatToOpenAIResponsesTool(tool: Tool): OpenAIClient.Responses.FunctionTool;
export declare function getChatMessages(memory: BufferWindowMemory): Promise<BaseMessage[]>;
