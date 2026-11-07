import type { IWebhookResponseData, WebhookResponseData } from 'n8n-workflow';
export declare function extractWebhookOnReceivedResponse(responseData: Extract<WebhookResponseData, 'noData'> | string | undefined, webhookResultData: IWebhookResponseData): unknown;
