import { EventService } from '@n8n/backend-services';
import { PrometheusMetricsConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusMcpPostSaveMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly eventService;
    constructor(config: PrometheusMetricsConfig, eventService: EventService);
    get enabled(): boolean;
    init(): void;
}
