import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { OutputFixingParser } from '@langchain/classic/output_parsers';
import { type IExecuteFunctions } from 'n8n-workflow';
export declare function processItem(ctx: IExecuteFunctions, itemIndex: number, llm: BaseLanguageModel, parser: OutputFixingParser<object>): Promise<object>;
