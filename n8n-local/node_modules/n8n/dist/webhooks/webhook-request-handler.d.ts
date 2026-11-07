import type express from 'express';
import type { ExpectedWebhookNodeType } from '../webhooks/node-type-matcher';
import { type WebhookSandboxSetting } from '../webhooks/webhook-response-headers';
import type { IWebhookManager } from '../webhooks/webhook.types';
export declare function createWebhookHandlerFor(webhookManager: IWebhookManager, expectedNodeType?: ExpectedWebhookNodeType, sandboxSetting?: WebhookSandboxSetting): express.RequestHandler;
