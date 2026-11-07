import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { type PromptCategorization } from '../types/categorization';
export declare function promptCategorizationChain(llm: BaseChatModel, userPrompt: string): Promise<PromptCategorization>;
