import { type ILoadOptionsFunctions } from 'n8n-workflow';
export declare function pineconeIndexSearch(this: ILoadOptionsFunctions): Promise<{
    results: {
        name: string;
        value: string;
    }[];
}>;
export declare function supabaseTableNameSearch(this: ILoadOptionsFunctions): Promise<{
    results: {
        name: string;
        value: string;
    }[];
}>;
export declare function qdrantCollectionsSearch(this: ILoadOptionsFunctions): Promise<{
    results: {
        name: string;
        value: string;
    }[];
}>;
export declare function milvusCollectionsSearch(this: ILoadOptionsFunctions): Promise<{
    results: {
        name: string;
        value: string;
    }[];
}>;
export declare function weaviateCollectionsSearch(this: ILoadOptionsFunctions): Promise<{
    results: {
        name: string;
        value: string;
    }[];
}>;
