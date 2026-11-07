import { EndpointsConfig, PrometheusMetricsConfig } from '@n8n/config';
import type express from 'express';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusRouteMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private readonly endpointsConfig;
    constructor(config: PrometheusMetricsConfig, endpointsConfig: EndpointsConfig);
    get enabled(): boolean;
    init(app?: express.Application): void;
    private registerMiddleware;
}
