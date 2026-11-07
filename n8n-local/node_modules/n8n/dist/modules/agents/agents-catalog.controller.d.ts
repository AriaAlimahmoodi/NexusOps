import { AgentProviderModelsQueryDto, type AgentProviderModelsResponse, type ChatIntegrationDescriptor } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentIntegrationPersistenceService } from './agent-integration-persistence.service';
import { AgentModelCatalogService } from './agent-model-catalog.service';
export declare class AgentsCatalogController {
    private readonly agentIntegrationPersistenceService;
    private readonly agentModelCatalogService;
    constructor(agentIntegrationPersistenceService: AgentIntegrationPersistenceService, agentModelCatalogService: AgentModelCatalogService);
    getModelCatalog(): Promise<Record<string, import("@n8n/agents").ProviderInfo>>;
    getProviderModels(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, provider: string, query: AgentProviderModelsQueryDto): Promise<AgentProviderModelsResponse>;
    listIntegrations(): ChatIntegrationDescriptor[];
}
