import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { UrlService } from '@n8n/backend-services';
import { TestWebhookRegistrationsService } from '../../../webhooks/test-webhook-registrations.service';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import { ChatTriggerResourceResolverBase } from './chat-trigger-resource.base';
export declare class ChatTriggerTestResourceResolver extends ChatTriggerResourceResolverBase {
    protected readonly config: GlobalConfig;
    private readonly registrations;
    private readonly urlService;
    protected readonly logger: Logger;
    protected readonly workflowFinderService: WorkflowFinderService;
    constructor(config: GlobalConfig, registrations: TestWebhookRegistrationsService, urlService: UrlService, logger: Logger, workflowFinderService: WorkflowFinderService);
    readonly id = "chat-trigger-test";
    protected get endpoint(): string;
    protected get baseUrl(): string;
    protected findChatTrigger(path: string): Promise<{
        node: import("n8n-workflow").INode;
        workflowId: string;
        workflowName: string;
    } | undefined>;
}
