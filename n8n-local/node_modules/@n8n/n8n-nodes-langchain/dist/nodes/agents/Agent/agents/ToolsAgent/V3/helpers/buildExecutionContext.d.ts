import type { BaseChatMemory } from '@langchain/classic/memory';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { IExecuteFunctions, ISupplyDataFunctions, INodeExecutionData } from 'n8n-workflow';
export type ToolsAgentExecutionContext = {
    items: INodeExecutionData[];
    batchSize: number;
    delayBetweenBatches: number;
    needsFallback: boolean;
    model: BaseChatModel;
    fallbackModel: BaseChatModel | null;
    memory: BaseChatMemory | undefined;
};
export declare function buildToolsAgentExecutionContext(ctx: IExecuteFunctions | ISupplyDataFunctions): Promise<ToolsAgentExecutionContext>;
