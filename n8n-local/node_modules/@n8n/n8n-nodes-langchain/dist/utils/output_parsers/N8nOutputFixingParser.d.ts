import type { Callbacks } from '@langchain/core/callbacks/manager';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { BaseOutputParser } from '@langchain/core/output_parsers';
import type { PromptTemplate } from '@langchain/core/prompts';
import type { ISupplyDataFunctions } from 'n8n-workflow';
import type { N8nStructuredOutputParser } from './N8nStructuredOutputParser';
export declare class N8nOutputFixingParser extends BaseOutputParser {
    private context;
    private model;
    private outputParser;
    private fixPromptTemplate;
    lc_namespace: string[];
    constructor(context: ISupplyDataFunctions, model: BaseLanguageModel, outputParser: N8nStructuredOutputParser, fixPromptTemplate: PromptTemplate);
    getRetryChain(): import("@langchain/core/runnables").Runnable<any, any, import("@langchain/core/runnables").RunnableConfig<Record<string, any>>>;
    parse(completion: string, callbacks?: Callbacks): Promise<object>;
    getFormatInstructions(): string;
    getSchema(): import("zod").ZodType<object, import("zod").ZodTypeDef, object>;
}
