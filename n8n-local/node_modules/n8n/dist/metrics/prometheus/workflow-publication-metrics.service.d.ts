import { PrometheusMetricsConfig, WorkflowsConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { EventService } from '@n8n/backend-services';
import type { PrometheusMetricsCollector } from './base';
import { DatabaseMetricQueryService } from './database-metric-query.service';
export declare class PrometheusWorkflowPublicationMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly workflowsConfig;
    private readonly instanceSettings;
    private readonly eventService;
    private readonly databaseQueries;
    constructor(config: PrometheusMetricsConfig, workflowsConfig: WorkflowsConfig, instanceSettings: InstanceSettings, eventService: EventService, databaseQueries: DatabaseMetricQueryService);
    get enabled(): boolean;
    init(): void;
    private initOutboxGauges;
    private initRecordOutcomeMetrics;
    private initTriggerMetrics;
    private initCleanupMetrics;
    private initReconciliationMetrics;
    private initGhostSweepMetrics;
}
