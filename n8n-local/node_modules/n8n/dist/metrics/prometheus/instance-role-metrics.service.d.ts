import { PrometheusMetricsConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusInstanceRoleMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly instanceSettings;
    private gauge;
    constructor(config: PrometheusMetricsConfig, instanceSettings: InstanceSettings);
    get enabled(): boolean;
    init(): void;
    updateOnLeaderTakeover(): void;
    updateOnLeaderStepdown(): void;
}
