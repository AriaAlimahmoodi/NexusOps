import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseLLMOutputParser } from '@langchain/core/output_parsers';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { ChainExecutionParams } from './types';
export declare class NaiveJsonOutputParser<T extends Record<string, any> = Record<string, any>> extends JsonOutputParser<T> {
    parse(text: string): Promise<T>;
}
export declare function isModelWithResponseFormat(llm: BaseLanguageModel): llm is BaseLanguageModel & {
    modelKwargs: {
        response_format: {
            type: string;
        };
    };
};
export declare function isModelInThinkingMode(llm: BaseLanguageModel): llm is BaseLanguageModel & {
    lc_kwargs: {
        invocationKwargs: {
            thinking: {
                type: string;
            };
        };
    };
};
export declare function isModelWithFormat(llm: BaseLanguageModel): llm is BaseLanguageModel & {
    format: string;
};
export declare function getOutputParserForLLM(llm: BaseChatModel | BaseLanguageModel): BaseLLMOutputParser<string | Record<string, unknown>>;
export declare function executeChain({ context, itemIndex, query, llm, outputParser, messages, fallbackLlm, }: ChainExecutionParams): Promise<unknown[]>;
