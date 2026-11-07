import type express from 'express';
import type { ParsedHitlCallbackReference } from 'n8n-core';
import { HitlInteractionWebhooks } from './hitl-interaction-webhooks';
import type { IWebhookResponseCallbackData, WaitingWebhookRequest } from './webhook.types';
export declare class SlackInteractionWebhooks extends HitlInteractionWebhooks {
    protected readonly platformNodeType = "n8n-nodes-base.slack";
    protected parseCallback(req: WaitingWebhookRequest): Promise<ParsedHitlCallbackReference | null>;
    protected beforeResume(req: WaitingWebhookRequest): void;
    protected handleUnrecognizedCallback(res: express.Response): IWebhookResponseCallbackData;
}
