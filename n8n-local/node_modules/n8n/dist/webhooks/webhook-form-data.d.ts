import formidable from 'formidable';
import type { IncomingMessage } from 'node:http';
export declare const createMultiFormDataParser: (maxFormDataSizeInMb: number) => (req: IncomingMessage) => Promise<{
    body: {
        data: formidable.Fields;
        files: formidable.Files;
    };
    cleanup: () => Promise<void>;
}>;
