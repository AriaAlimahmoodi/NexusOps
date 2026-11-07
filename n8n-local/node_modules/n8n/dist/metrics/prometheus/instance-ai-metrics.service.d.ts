import { EventService } from '@n8n/backend-services';
import { PrometheusMetricsConfig } from '@n8n/config';
import { InstanceAiRunProbe } from '../../modules/instance-ai/instance-ai-run-probe';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusInstanceAiMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly eventService;
    private readonly runProbe;
    constructor(config: PrometheusMetricsConfig, eventService: EventService, runProbe: InstanceAiRunProbe);
    get enabled(): boolean;
    init(): void;
}
