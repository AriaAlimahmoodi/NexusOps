import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
export declare function modelSearch(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
export declare function audioModelSearch(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
export declare function imageGenerationModelSearch(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
export declare function imageEditModelSearch(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
export declare function videoGenerationModelSearch(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
