import { type Result } from '@n8n/utils/result';
import type { ITaskData, WebhookResponseData } from 'n8n-workflow';
import { OperationalError } from 'n8n-workflow';
import type { Readable } from 'node:stream';
type StaticResponse = {
    type: 'static';
    body: unknown;
    contentType: string | undefined;
};
type StreamResponse = {
    type: 'stream';
    stream: Readable;
    contentType: string | undefined;
};
export declare function extractWebhookLastNodeResponse(responseDataType: WebhookResponseData | undefined, lastNodeTaskData: ITaskData, checkAllMainOutputs: boolean | undefined, options: {
    responsePropertyName: string | undefined;
    responseContentType: string | undefined;
    responseBinaryPropertyName: string | number | boolean | unknown[] | undefined;
}): Promise<Result<StaticResponse | StreamResponse, OperationalError>>;
export {};
