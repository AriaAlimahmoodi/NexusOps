export declare class TokenExchangeConfig {
    enabled: boolean;
    embedEnabled: boolean;
    maxTokenTtl: number;
    excludeOwner: boolean;
    trustedKeys: string;
    keyRefreshIntervalSeconds: number;
    jtiCleanupIntervalSeconds: number;
    jtiCleanupBatchSize: number;
    rateLimitEmbedLogin: number;
    rateLimitTokenExchange: number;
}
