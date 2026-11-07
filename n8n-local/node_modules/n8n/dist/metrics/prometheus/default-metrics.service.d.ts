import { PrometheusMetricsConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusDefaultMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    constructor(config: PrometheusMetricsConfig);
    init(): void;
    get enabled(): boolean;
}
