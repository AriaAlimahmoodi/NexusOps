import { InstanceSettings } from 'n8n-core';
import { type IWebhookData, type IWorkflowBase, type IDestinationNode } from 'n8n-workflow';
import { CacheService } from '@n8n/backend-services';
declare const TEST_WEBHOOK_REGISTRATION_VERSION = 1;
export type TestWebhookRegistration = {
    version: typeof TEST_WEBHOOK_REGISTRATION_VERSION;
    pushRef?: string;
    workflowEntity: IWorkflowBase;
    destinationNode?: IDestinationNode;
    webhook: IWebhookData;
    encryptedRunnerIdentity?: string;
    expiresAt?: number;
};
export declare class TestWebhookRegistrationsService {
    private readonly cacheService;
    private readonly instanceSettings;
    constructor(cacheService: CacheService, instanceSettings: InstanceSettings);
    private readonly cacheKey;
    register(registration: TestWebhookRegistration, ttl?: number): Promise<void>;
    deregister(arg: IWebhookData | string): Promise<void>;
    get(key: string): Promise<TestWebhookRegistration | undefined>;
    getAllKeys(): Promise<string[]>;
    getAllRegistrations(): Promise<TestWebhookRegistration[]>;
    getRegistrationsHash(): Promise<import("@n8n/backend-services").MaybeHash<TestWebhookRegistration>>;
    private prune;
    toKey(webhook: Pick<IWebhookData, 'webhookId' | 'httpMethod' | 'path'>): string;
}
export {};
