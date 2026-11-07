import { EventService } from '@n8n/backend-services';
import { ExecutionsConfig, PrometheusMetricsConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusQueueMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly executionsConfig;
    private readonly instanceSettings;
    private readonly eventService;
    constructor(config: PrometheusMetricsConfig, executionsConfig: ExecutionsConfig, instanceSettings: InstanceSettings, eventService: EventService);
    get enabled(): boolean;
    init(): void;
}
