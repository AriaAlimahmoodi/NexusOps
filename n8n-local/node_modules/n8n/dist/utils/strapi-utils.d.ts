import type { IDataObject } from 'n8n-workflow';
export type StrapiEntity<T> = {
    id: number;
    documentId?: string;
    attributes: T;
} | ({
    id: number;
    documentId?: string;
} & T);
export interface PaginationRequestOptions {
    throwOnError?: boolean;
    abortSignal?: AbortSignal;
}
export type StrapiFilters = {
    [key: string]: {
        ['$eq']?: string;
        ['$in']?: string[];
    };
};
type PaginationRequestParams = {
    filters?: StrapiFilters;
    fields?: string[];
    pagination: {
        page: number;
        pageSize: number;
    };
    maxAiNodeSdk?: number;
    maxN8nNodesApiVersion?: string;
    version?: number;
};
export declare function paginatedRequest<T>(url: string, params: PaginationRequestParams, options?: PaginationRequestOptions): Promise<T[]>;
export declare function buildStrapiUpdateQuery(ids: number[]): IDataObject;
export {};
