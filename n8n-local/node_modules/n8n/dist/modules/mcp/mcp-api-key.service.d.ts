import { ApiKey, ApiKeyRepository, User } from '@n8n/db';
import { EntityManager } from '@n8n/typeorm';
import { AuthStrategyRegistry, UserWithContext } from '@n8n/backend-services/auth';
import { JwtService } from '@n8n/backend-services';
export declare class McpServerApiKeyService {
    private readonly apiKeyRepository;
    private readonly jwtService;
    private readonly authStrategyRegistry;
    constructor(apiKeyRepository: ApiKeyRepository, jwtService: JwtService, authStrategyRegistry: AuthStrategyRegistry);
    createMcpServerApiKey(user: User, trx?: EntityManager): Promise<ApiKey>;
    findServerApiKeyForUser(user: User, { redact }?: {
        redact?: boolean | undefined;
    }): Promise<ApiKey | null>;
    verifyApiKey(apiKey: string): Promise<UserWithContext>;
    deleteAllMcpApiKeysForUser(user: User, trx?: EntityManager): Promise<void>;
    private redactApiKey;
    getOrCreateApiKey(user: User): Promise<ApiKey>;
    rotateMcpServerApiKey(user: User): Promise<ApiKey>;
}
