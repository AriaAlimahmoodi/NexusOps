import type { IBinaryData, IExecuteFunctions } from 'n8n-workflow';
export declare function getBinaryDataFile(ctx: IExecuteFunctions, itemIdx: number, binaryPropertyData: string | IBinaryData): Promise<{
    filename: string | undefined;
    contentType: string;
    fileContent: Buffer<ArrayBufferLike> | import("stream").Readable;
}>;
