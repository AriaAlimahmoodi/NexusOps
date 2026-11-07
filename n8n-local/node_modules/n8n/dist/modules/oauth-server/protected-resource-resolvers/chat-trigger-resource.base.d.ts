import type { Logger } from '@n8n/backend-common';
import type { GlobalConfig } from '@n8n/config';
import type { INode } from 'n8n-workflow';
import type { ProtectedResource, ProtectedResourceResolver } from '@n8n/backend-services/auth';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
export interface ChatTriggerLookupResult {
    node: INode;
    workflowId: string;
    workflowName: string;
}
export declare abstract class ChatTriggerResourceResolverBase implements ProtectedResourceResolver {
    abstract readonly id: string;
    readonly scopes: string[];
    protected abstract readonly config: GlobalConfig;
    protected abstract readonly logger: Logger;
    protected abstract readonly workflowFinderService: WorkflowFinderService;
    protected abstract get endpoint(): string;
    protected abstract get baseUrl(): string;
    protected abstract findChatTrigger(path: string): Promise<ChatTriggerLookupResult | undefined>;
    resolveByUrl(resourceUrl: string): Promise<ProtectedResource | undefined>;
    resolveByPath(pathname: string): Promise<ProtectedResource | undefined>;
}
