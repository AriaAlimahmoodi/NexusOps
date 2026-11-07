import type { BaseMessage } from '@langchain/core/messages';
export declare function hasCacheControl(block: unknown): block is {
    cache_control?: {
        type: 'ephemeral';
    };
};
export declare function findUserToolMessageIndices(messages: BaseMessage[]): number[];
export declare function cleanStaleWorkflowContext(messages: BaseMessage[], userToolIndices: number[]): void;
export declare function applyCacheControlMarkers(messages: BaseMessage[], userToolIndices: number[], workflowContext: string): void;
export declare function applySubgraphCacheMarkers(messages: BaseMessage[]): void;
export declare function stripAllCacheControlMarkers(messages: BaseMessage[]): void;
