import type { INodeExecutionData } from 'n8n-workflow';
export declare const MAX_ITEMS = 20;
export declare const MAX_OUTPUT_CHARS = 50000;
export declare const ITEM_SHAPE_HINT: string;
export declare const QUERY_WHEN_TRUNCATED_HINT = "Use only when a previous non-query result came back truncated \u2014 never re-query data you already received in full.";
export declare function toSafeItem(item: INodeExecutionData): Record<string, unknown>;
export declare function trimItems(allItems: INodeExecutionData[]): {
    items: Array<Record<string, unknown>>;
    truncated: boolean;
};
export declare function runQuery(data: unknown, query: string): {
    result: unknown;
    truncated: boolean;
} | {
    error: string;
};
export declare function queryItems(items: INodeExecutionData[], query: string): {
    result: unknown;
    truncated: boolean;
} | {
    error: string;
};
