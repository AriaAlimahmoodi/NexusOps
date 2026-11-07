import type { INodeTypeDescription, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';
import { Node } from 'n8n-workflow';
export declare class McpTrigger extends Node {
    description: INodeTypeDescription;
    webhook(context: IWebhookFunctions): Promise<IWebhookResponseData>;
}
