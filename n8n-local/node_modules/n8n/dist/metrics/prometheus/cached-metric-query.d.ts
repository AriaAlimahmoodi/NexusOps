import { DbConnection } from '@n8n/db';
import type { JsonValue } from 'n8n-workflow';
import { CacheService } from '@n8n/backend-services';
type CachedMetricQueryOpts<T extends JsonValue> = {
    cacheService: CacheService;
    cacheKey: string;
    ttlMs: number;
    query: () => Promise<T>;
    isDatabaseConnected: () => boolean;
};
export declare function toGaugeValue<T>(value: T | undefined, select: (value: T) => number): number;
export declare class CachedMetricQuery<T extends JsonValue> {
    private readonly cacheService;
    private readonly cacheKey;
    private readonly ttlMs;
    private readonly query;
    private readonly isDatabaseConnected;
    private inFlight;
    constructor({ cacheService, cacheKey, ttlMs, query, isDatabaseConnected, }: CachedMetricQueryOpts<T>);
    get(): Promise<T | undefined>;
    private load;
    private readCache;
}
export declare class CachedMetricQueryFactory {
    private readonly cacheService;
    private readonly dbConnection;
    constructor(cacheService: CacheService, dbConnection: DbConnection);
    create<T extends JsonValue>(opts: Pick<CachedMetricQueryOpts<T>, 'cacheKey' | 'ttlMs' | 'query'>): CachedMetricQuery<T>;
}
export {};
