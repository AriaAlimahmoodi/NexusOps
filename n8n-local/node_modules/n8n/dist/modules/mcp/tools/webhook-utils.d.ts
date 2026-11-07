import type { User } from '@n8n/db';
import { type INode, type INodeTypes } from 'n8n-workflow';
import type { CredentialsService } from '../../../credentials/credentials.service';
export type WebhookEndpoints = {
    webhook: string;
    webhookTest: string;
};
export declare const getTriggerDetails: (user: User, supportedTriggers: INode[], unsupportedTriggers: INode[], baseUrl: string, credentialsService: CredentialsService, nodeTypes: INodeTypes, endpoints: WebhookEndpoints, workflowId: string, testBaseUrl?: string) => Promise<string>;
export declare const getWebhookDetails: (user: User, webhookNodes: INode[], baseUrl: string, credentialsService: CredentialsService, nodeTypes: INodeTypes, endpoints: WebhookEndpoints, workflowId: string, testBaseUrl?: string) => Promise<string>;
