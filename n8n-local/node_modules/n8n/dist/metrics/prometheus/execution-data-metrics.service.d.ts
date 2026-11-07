import { EventService } from '@n8n/backend-services';
import { PrometheusMetricsConfig } from '@n8n/config';
import { StorageConfig } from 'n8n-core';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusExecutionDataMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly eventService;
    private readonly storageConfig;
    constructor(config: PrometheusMetricsConfig, eventService: EventService, storageConfig: StorageConfig);
    get enabled(): boolean;
    init(): void;
}
