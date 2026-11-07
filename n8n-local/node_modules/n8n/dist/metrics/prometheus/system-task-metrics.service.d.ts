import { EventService } from '@n8n/backend-services';
import { PrometheusMetricsConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
import { DatabaseMetricQueryService } from './database-metric-query.service';
export declare class PrometheusSystemTaskMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly eventService;
    private readonly databaseQueries;
    constructor(config: PrometheusMetricsConfig, eventService: EventService, databaseQueries: DatabaseMetricQueryService);
    get enabled(): boolean;
    init(): void;
    private applyDurableJobStates;
}
