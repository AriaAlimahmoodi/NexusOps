import { PrometheusMetricsConfig } from '@n8n/config';
import { MessageEventBus } from '../../eventbus/message-event-bus/message-event-bus';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusEventBusMetricsService implements PrometheusMetricsCollector {
    private readonly eventBus;
    private readonly config;
    private readonly countersByEventName;
    constructor(eventBus: MessageEventBus, config: PrometheusMetricsConfig);
    get enabled(): boolean;
    init(): void;
    private toCounter;
    private toMetricName;
    private toLabels;
    private buildWorkflowLabels;
}
