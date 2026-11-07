import type { Attachment } from 'chat';
export interface GraphHttp {
    get(url: string, config?: {
        responseType?: 'arraybuffer';
        maxContentLength?: number;
    }): Promise<{
        data: unknown;
    }>;
}
export declare function graphHttpOf(adapter: unknown): GraphHttp | undefined;
interface GraphMessagePaths {
    message: string;
    filesFolder?: string;
}
export declare function graphMessagePaths(activity: unknown): GraphMessagePaths | undefined;
export declare function statusOf(error: unknown): unknown;
export declare function fetchTeamsMessageFiles(http: GraphHttp, activity: unknown): Promise<Attachment[]>;
export {};
