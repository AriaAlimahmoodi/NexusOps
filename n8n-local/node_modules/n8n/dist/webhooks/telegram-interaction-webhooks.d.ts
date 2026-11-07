import type { ParsedHitlCallbackReference } from 'n8n-core';
import { HitlInteractionWebhooks } from './hitl-interaction-webhooks';
import type { WaitingWebhookRequest } from './webhook.types';
export declare class TelegramInteractionWebhooks extends HitlInteractionWebhooks {
    protected readonly platformNodeType = "n8n-nodes-base.telegram";
    protected parseCallback(req: WaitingWebhookRequest): Promise<ParsedHitlCallbackReference | null>;
    protected beforeResume(req: WaitingWebhookRequest): void;
}
