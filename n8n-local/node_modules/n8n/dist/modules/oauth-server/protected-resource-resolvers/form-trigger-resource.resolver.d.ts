import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { WorkflowRepository } from '@n8n/db';
import { UrlService } from '@n8n/backend-services';
import { type ProtectedResourceResolver } from '@n8n/backend-services/auth';
import { WebhookService } from '../../../webhooks/webhook.service';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
export declare class FormTriggerResourceResolver implements ProtectedResourceResolver {
    private readonly config;
    private readonly webhookService;
    private readonly workflowRepository;
    private readonly urlService;
    private readonly logger;
    private readonly workflowFinderService;
    constructor(config: GlobalConfig, webhookService: WebhookService, workflowRepository: WorkflowRepository, urlService: UrlService, logger: Logger, workflowFinderService: WorkflowFinderService);
    readonly id = "form-trigger";
    readonly scopes: string[];
    resolveByUrl(resourceUrl: string): Promise<{
        authorize: (user: import("@n8n/inbound-auth").ResourcePrincipal) => Promise<boolean>;
        getGrant?: (() => import("n8n-workflow").OAuthResourceGrant) | undefined;
        id: string;
        isFirstParty: boolean;
        surface: 'trigger';
        getResourceUrl: () => string;
        getAudiences: () => string[];
        getAllowedRedirectUris: () => Promise<string[]>;
        getAcceptedSourceIds: () => string[];
        scopes: string[];
        displayName: string;
        uiHints: import("@n8n/inbound-auth").ConsentUiHints;
    } | undefined>;
    resolveByPath(pathname: string): Promise<{
        authorize: (user: import("@n8n/inbound-auth").ResourcePrincipal) => Promise<boolean>;
        getGrant?: (() => import("n8n-workflow").OAuthResourceGrant) | undefined;
        id: string;
        isFirstParty: boolean;
        surface: 'trigger';
        getResourceUrl: () => string;
        getAudiences: () => string[];
        getAllowedRedirectUris: () => Promise<string[]>;
        getAcceptedSourceIds: () => string[];
        scopes: string[];
        displayName: string;
        uiHints: import("@n8n/inbound-auth").ConsentUiHints;
    } | undefined>;
}
