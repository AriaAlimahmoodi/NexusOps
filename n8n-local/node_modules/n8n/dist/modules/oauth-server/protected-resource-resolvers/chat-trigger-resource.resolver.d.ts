import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { WorkflowRepository } from '@n8n/db';
import { UrlService } from '@n8n/backend-services';
import { WebhookService } from '../../../webhooks/webhook.service';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import { ChatTriggerResourceResolverBase } from './chat-trigger-resource.base';
export declare class ChatTriggerResourceResolver extends ChatTriggerResourceResolverBase {
    protected readonly config: GlobalConfig;
    private readonly webhookService;
    private readonly workflowRepository;
    private readonly urlService;
    protected readonly logger: Logger;
    protected readonly workflowFinderService: WorkflowFinderService;
    constructor(config: GlobalConfig, webhookService: WebhookService, workflowRepository: WorkflowRepository, urlService: UrlService, logger: Logger, workflowFinderService: WorkflowFinderService);
    readonly id = "chat-trigger";
    protected get endpoint(): string;
    protected get baseUrl(): string;
    protected findChatTrigger(path: string): Promise<{
        node: import("n8n-workflow").INode;
        workflowId: string;
        workflowName: string;
    } | undefined>;
}
