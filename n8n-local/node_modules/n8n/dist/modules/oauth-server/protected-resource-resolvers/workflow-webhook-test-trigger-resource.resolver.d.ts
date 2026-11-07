import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { UrlService } from '@n8n/backend-services';
import { type ProtectedResource, type ProtectedResourceResolver } from '@n8n/backend-services/auth';
import { TestWebhooks } from '../../../webhooks/test-webhooks';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
export declare class WorkflowWebhookTestTriggerResourceResolver implements ProtectedResourceResolver {
    private readonly config;
    private readonly testWebhooks;
    private readonly urlService;
    private readonly logger;
    private readonly workflowFinderService;
    constructor(config: GlobalConfig, testWebhooks: TestWebhooks, urlService: UrlService, logger: Logger, workflowFinderService: WorkflowFinderService);
    readonly id = "workflow-webhook-test-trigger";
    readonly scopes: string[];
    resolveByUrl(resourceUrl: string): Promise<ProtectedResource | undefined>;
    resolveByPath(pathname: string, search?: string): Promise<ProtectedResource | undefined>;
    private resolveWebhookNode;
}
