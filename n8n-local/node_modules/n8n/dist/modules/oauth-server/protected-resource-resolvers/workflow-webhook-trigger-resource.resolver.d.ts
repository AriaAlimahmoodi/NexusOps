import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { WorkflowRepository } from '@n8n/db';
import { UrlService } from '@n8n/backend-services';
import { type ProtectedResource, type ProtectedResourceResolver } from '@n8n/backend-services/auth';
import { WebhookService } from '../../../webhooks/webhook.service';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
export declare class WorkflowWebhookTriggerResourceResolver implements ProtectedResourceResolver {
    private readonly config;
    private readonly webhookService;
    private readonly workflowRepository;
    private readonly urlService;
    private readonly logger;
    private readonly workflowFinderService;
    constructor(config: GlobalConfig, webhookService: WebhookService, workflowRepository: WorkflowRepository, urlService: UrlService, logger: Logger, workflowFinderService: WorkflowFinderService);
    readonly id = "workflow-webhook-trigger";
    readonly scopes: string[];
    resolveByUrl(resourceUrl: string): Promise<ProtectedResource | undefined>;
    resolveByPath(pathname: string, search?: string): Promise<ProtectedResource | undefined>;
    private resolveWebhookNode;
}
