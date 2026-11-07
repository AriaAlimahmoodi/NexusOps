import { PrometheusMetricsConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import type { PrometheusMetricsCollector } from './base';
import { DatabaseMetricQueryService } from './database-metric-query.service';
export declare class PrometheusWorkflowInfoMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly databaseQueries;
    private readonly instanceSettings;
    constructor(config: PrometheusMetricsConfig, databaseQueries: DatabaseMetricQueryService, instanceSettings: InstanceSettings);
    get enabled(): boolean;
    init(): void;
    private initGauge;
}
