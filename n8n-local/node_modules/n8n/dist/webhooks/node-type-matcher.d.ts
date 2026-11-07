import type { IWebhookDescription } from 'n8n-workflow';
export type ExpectedWebhookNodeType = NonNullable<IWebhookDescription['nodeType']>;
export declare function matchesExpectedNodeType(expected: ExpectedWebhookNodeType, declared?: IWebhookDescription['nodeType']): boolean;
