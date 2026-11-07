import type { WebhookNoResponse, WebhookResponse } from './webhook-response';
import type { IWebhookResponseCallbackData } from './webhook.types';
export type WebhookCallbackResponseData = IWebhookResponseCallbackData & {
    noWebhookResponse?: false;
};
export type WebhookResponseCallback = (error: Error | null, data: IWebhookResponseCallbackData | WebhookResponse) => void;
export declare class WebhookResponder {
    private readonly sendResponse;
    private responded;
    constructor(sendResponse: WebhookResponseCallback);
    get hasResponded(): boolean;
    respondWith(data: WebhookCallbackResponseData | Exclude<WebhookResponse, WebhookNoResponse>): void;
    respondWithNoResponse(): void;
    respondWithError(error: Error): void;
    markResponded(): void;
}
