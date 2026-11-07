import type { LookupAddress, LookupOptions } from 'node:dns';
import { InMemoryDnsCache } from './in-memory-dns-cache.service';
export type DnsLookupOptions = Pick<LookupOptions, 'all' | 'family' | 'order' | 'verbatim' | 'hints'>;
export declare class DnsResolver {
    private readonly dnsCache;
    private readonly inFlightByCacheKey;
    constructor(dnsCache: InMemoryDnsCache);
    lookup(hostname: string, options?: DnsLookupOptions): Promise<LookupAddress[]>;
    private doLookup;
    private buildCacheKey;
    private normalizeOptions;
    private normalizeIpFamily;
}
