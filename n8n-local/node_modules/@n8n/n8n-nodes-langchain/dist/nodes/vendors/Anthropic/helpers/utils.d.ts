import type { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import type { File } from './interfaces';
export declare function getMimeType(contentType?: string): string | undefined;
export declare function downloadFile(this: IExecuteFunctions, url: string, qs?: IDataObject): Promise<{
    fileContent: Buffer<ArrayBuffer>;
    mimeType: string;
}>;
export declare function uploadFile(this: IExecuteFunctions, fileContent: Buffer, mimeType: string, fileName?: string): Promise<File>;
export declare function splitByComma(str: string): string[];
export declare function getBaseUrl(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<string>;
