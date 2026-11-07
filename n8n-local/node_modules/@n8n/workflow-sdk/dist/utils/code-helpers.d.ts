import type { CodeResult, AllItemsContext, EachItemContext } from '../types/base';
export declare function runOnceForAllItems<T = unknown>(fn: (ctx: AllItemsContext) => Array<{
    json: T;
}>): CodeResult<T>;
export declare function runOnceForEachItem<T = unknown>(fn: (ctx: EachItemContext) => {
    json: T;
} | null): CodeResult<T>;
