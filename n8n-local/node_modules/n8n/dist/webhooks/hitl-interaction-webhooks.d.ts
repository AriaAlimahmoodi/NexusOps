import type express from 'express';
import type { ParsedHitlCallbackReference } from 'n8n-core';
import { WaitingWebhooks } from './waiting-webhooks';
import type { IWebhookResponseCallbackData, WaitingWebhookRequest } from './webhook.types';
export declare abstract class HitlInteractionWebhooks extends WaitingWebhooks {
    protected reject(res: express.Response, status: number): IWebhookResponseCallbackData;
    protected abstract parseCallback(req: WaitingWebhookRequest): Promise<ParsedHitlCallbackReference | null>;
    protected abstract readonly platformNodeType: string;
    protected handleUnrecognizedCallback(res: express.Response): IWebhookResponseCallbackData;
    protected beforeResume(_req: WaitingWebhookRequest): void;
    private validate;
    executeWebhook(req: WaitingWebhookRequest, res: express.Response): Promise<IWebhookResponseCallbackData>;
}
