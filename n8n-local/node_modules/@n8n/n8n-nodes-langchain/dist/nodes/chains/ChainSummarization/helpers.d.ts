import type { SummarizationChainParams } from '@langchain/classic/chains';
interface ChainTypeOptions {
    combineMapPrompt?: string;
    prompt?: string;
    refinePrompt?: string;
    refineQuestionPrompt?: string;
}
export declare function getChainPromptsArgs(type: 'stuff' | 'map_reduce' | 'refine', options: ChainTypeOptions): SummarizationChainParams;
export {};
