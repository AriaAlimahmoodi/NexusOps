import { type AgentProviderModelsResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { BuilderModelLiveLookupService } from './builder/builder-model-live-lookup.service';
import { AgentDefaultModelResolverService } from './agent-default-model-resolver.service';
export declare class AgentModelCatalogService {
    private readonly logger;
    private readonly builderModelLiveLookupService;
    private readonly agentDefaultModelResolverService;
    constructor(logger: Logger, builderModelLiveLookupService: BuilderModelLiveLookupService, agentDefaultModelResolverService: AgentDefaultModelResolverService);
    getProviderModels(user: User, projectId: string, provider: string, credentialId?: string): Promise<AgentProviderModelsResponse>;
    private unverifiedCatalog;
    private unavailableModels;
    private modelsFromLookup;
    private enrichManagedModels;
    private verifyCuratedModels;
    private withDefaultModel;
    private logLiveLookupFailure;
    private getCatalogModels;
}
