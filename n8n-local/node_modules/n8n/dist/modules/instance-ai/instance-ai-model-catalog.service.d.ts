import { type InstanceAiModelCatalogResponse } from '@n8n/api-types';
import type { ProviderCatalog } from '@n8n/agents/catalog';
import { Logger } from '@n8n/backend-common';
export declare class InstanceAiModelCatalogService {
    private readonly logger;
    private cached?;
    private fetchPromise?;
    constructor(logger: Logger);
    getModels(): Promise<InstanceAiModelCatalogResponse>;
    private refresh;
    private fetchCatalogWithTimeout;
    protected fetchCatalog(signal: AbortSignal): Promise<ProviderCatalog>;
    private toResponse;
    private getProviderModels;
}
