import type { Readable } from 'stream';
import type { WebhookResponseHeaders } from './webhook-response-headers';
export declare const WebhookResponseTag: unique symbol;
export type WebhookNoResponse = {
    [WebhookResponseTag]: 'noResponse';
};
export type WebhookStaticResponse = {
    [WebhookResponseTag]: 'static';
    body: unknown;
    headers: WebhookResponseHeaders | undefined;
    code: number | undefined;
};
export type WebhookResponseStream = {
    [WebhookResponseTag]: 'stream';
    stream: Readable;
    code: number | undefined;
    headers: WebhookResponseHeaders | undefined;
};
export type WebhookResponse = WebhookNoResponse | WebhookStaticResponse | WebhookResponseStream;
export declare const isWebhookResponse: (response: unknown) => response is WebhookResponse;
export declare const isWebhookNoResponse: (response: unknown) => response is WebhookNoResponse;
export declare const isWebhookStaticResponse: (response: unknown) => response is WebhookStaticResponse;
export declare const isWebhookStreamResponse: (response: unknown) => response is WebhookResponseStream;
export declare const createNoResponse: () => WebhookNoResponse;
export declare const createStaticResponse: (body: unknown, code: number | undefined, headers: WebhookResponseHeaders | undefined) => WebhookStaticResponse;
export declare const createStreamResponse: (stream: Readable, code: number | undefined, headers: WebhookResponseHeaders | undefined) => WebhookResponseStream;
