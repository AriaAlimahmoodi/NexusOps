import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Logger } from 'n8n-workflow';
import { z } from 'zod';
import type { ParameterUpdaterOptions } from '../types/config';
export declare const parametersSchema: z.ZodObject<{
    parameters: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    parameters: {} & {
        [k: string]: unknown;
    };
}, {
    parameters: {} & {
        [k: string]: unknown;
    };
}>;
export declare const createParameterUpdaterChain: (llm: BaseChatModel, options: ParameterUpdaterOptions, logger?: Logger) => import("@langchain/core/runnables").Runnable<any, Record<string, any>, import("@langchain/core/runnables").RunnableConfig<Record<string, any>>>;
