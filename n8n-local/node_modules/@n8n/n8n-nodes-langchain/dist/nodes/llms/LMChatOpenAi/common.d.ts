import type { ChatOpenAIToolType } from '@langchain/openai/dist/utils/tools';
import type { BuiltInTools, ChatResponseRequest, ModelOptions } from './types';
export declare const formatBuiltInTools: (builtInTools: BuiltInTools) => ChatOpenAIToolType[];
export declare const prepareAdditionalResponsesParams: (options: ModelOptions) => Partial<ChatResponseRequest>;
