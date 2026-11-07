import { CacheService } from '@n8n/backend-services';
export declare class ActivationErrorsService {
    private readonly cacheService;
    private readonly cacheKey;
    constructor(cacheService: CacheService);
    register(workflowId: string, errorMessage: string): Promise<void>;
    deregister(workflowId: string): Promise<void>;
    get(workflowId: string): Promise<string | null>;
    getAll(): Promise<import("@n8n/backend-services").Hash<string>>;
    clearAll(): Promise<void>;
}
