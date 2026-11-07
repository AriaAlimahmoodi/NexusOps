import { PrometheusMetricsConfig, SsrfProtectionConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
import { SsrfProtectionService } from '@n8n/backend-network';
export declare class PrometheusSsrfMetricsService implements PrometheusMetricsCollector {
    private readonly ssrfProtectionService;
    private readonly config;
    private readonly ssrfConfig;
    constructor(ssrfProtectionService: SsrfProtectionService, config: PrometheusMetricsConfig, ssrfConfig: SsrfProtectionConfig);
    get enabled(): boolean;
    init(): void;
}
