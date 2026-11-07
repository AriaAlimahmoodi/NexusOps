import type { LLMResult } from '@langchain/core/outputs';
import type { INodeType, INodeTypeDescription, ISupplyDataFunctions, SupplyData } from 'n8n-workflow';
export declare function tokensUsageParser(result: LLMResult): {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
};
export declare class LmChatCohere implements INodeType {
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
