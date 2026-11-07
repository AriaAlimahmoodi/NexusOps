import { UrlService } from '@n8n/backend-services';
import { type ProtectedResourceResolver } from '@n8n/backend-services/auth';
import { TestWebhookRegistrationsService } from '../../../webhooks/test-webhook-registrations.service';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
export declare class WorkflowMcpTestTriggerResourceResolver implements ProtectedResourceResolver {
    private readonly config;
    private readonly registrations;
    private readonly urlService;
    private readonly logger;
    private readonly workflowFinderService;
    constructor(config: GlobalConfig, registrations: TestWebhookRegistrationsService, urlService: UrlService, logger: Logger, workflowFinderService: WorkflowFinderService);
    readonly id = "workflow-mcp-test-trigger";
    readonly scopes: string[];
    resolveByUrl(resourceUrl: string): Promise<{
        authorize: (user: import("@n8n/inbound-auth").ResourcePrincipal) => Promise<boolean>;
        getGrant?: (() => import("n8n-workflow").OAuthResourceGrant) | undefined;
        id: string;
        surface: 'trigger';
        getResourceUrl: () => string;
        getAudiences: () => string[];
        scopes: string[];
        displayName: string;
    } | undefined>;
    resolveByPath(pathname: string): Promise<{
        authorize: (user: import("@n8n/inbound-auth").ResourcePrincipal) => Promise<boolean>;
        getGrant?: (() => import("n8n-workflow").OAuthResourceGrant) | undefined;
        id: string;
        surface: 'trigger';
        getResourceUrl: () => string;
        getAudiences: () => string[];
        scopes: string[];
        displayName: string;
    } | undefined>;
}
