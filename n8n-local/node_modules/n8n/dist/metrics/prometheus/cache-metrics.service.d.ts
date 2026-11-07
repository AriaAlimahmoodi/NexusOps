import { PrometheusMetricsConfig } from '@n8n/config';
import { CacheService } from '@n8n/backend-services';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusCacheMetricsService implements PrometheusMetricsCollector {
    private readonly cacheService;
    private readonly config;
    constructor(cacheService: CacheService, config: PrometheusMetricsConfig);
    get enabled(): boolean;
    init(): void;
    private initializeCounter;
}
