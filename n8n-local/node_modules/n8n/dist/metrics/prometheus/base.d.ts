import type express from 'express';
export interface PrometheusMetricsCollector {
    get enabled(): boolean;
    init(app?: express.Application): void;
}
