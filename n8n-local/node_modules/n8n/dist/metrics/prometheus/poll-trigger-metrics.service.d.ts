import { EventService } from '@n8n/backend-services';
import { PrometheusMetricsConfig } from '@n8n/config';
import { InstanceSettings, TriggersAndPollers } from 'n8n-core';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusPollTriggerMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly instanceSettings;
    private readonly eventService;
    private readonly triggersAndPollers;
    constructor(config: PrometheusMetricsConfig, instanceSettings: InstanceSettings, eventService: EventService, triggersAndPollers: TriggersAndPollers);
    get enabled(): boolean;
    init(): void;
}
