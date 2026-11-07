import { InMemoryDnsCache } from '@n8n/backend-network';
import { PrometheusMetricsConfig, SsrfProtectionConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusDnsCacheMetricsService implements PrometheusMetricsCollector {
    private readonly dnsCache;
    private readonly config;
    private readonly ssrfConfig;
    constructor(dnsCache: InMemoryDnsCache, config: PrometheusMetricsConfig, ssrfConfig: SsrfProtectionConfig);
    get enabled(): boolean;
    init(): void;
    private initializeCounter;
}
