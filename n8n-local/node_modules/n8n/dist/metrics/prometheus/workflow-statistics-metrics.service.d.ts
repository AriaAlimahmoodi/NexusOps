import { PrometheusMetricsConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
import { DatabaseMetricQueryService } from './database-metric-query.service';
export declare class PrometheusWorkflowStatisticsMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly databaseQueries;
    constructor(config: PrometheusMetricsConfig, databaseQueries: DatabaseMetricQueryService);
    get enabled(): boolean;
    init(): void;
    private createWorkflowStatisticsGauge;
}
