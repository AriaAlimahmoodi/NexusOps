import { PrometheusMetricsConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusPssMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    constructor(config: PrometheusMetricsConfig);
    get enabled(): boolean;
    init(): void;
    private isAvailable;
}
