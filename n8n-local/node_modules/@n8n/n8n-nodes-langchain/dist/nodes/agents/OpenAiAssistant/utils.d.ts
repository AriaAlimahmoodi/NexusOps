import type { Tool } from '@langchain/core/tools';
import type { OpenAIClient } from '@langchain/openai';
export declare function formatToOpenAIFunction(tool: Tool): OpenAIClient.Chat.ChatCompletionCreateParams.Function;
export declare function formatToOpenAITool(tool: Tool): OpenAIClient.Chat.ChatCompletionTool;
export declare function formatToOpenAIAssistantTool(tool: Tool): OpenAIClient.Beta.AssistantTool;
