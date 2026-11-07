import { CacheService } from '@n8n/backend-services';
export type AuthorizeIntent = {
    credentialId: string;
    resolverId: string;
    identity: string;
    userId?: string;
    metadata?: Record<string, unknown>;
};
export declare class AuthorizeIntentService {
    private readonly cacheService;
    constructor(cacheService: CacheService);
    create(intent: AuthorizeIntent): Promise<string>;
    get(token: string): Promise<AuthorizeIntent | undefined>;
    private cacheKey;
}
