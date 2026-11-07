import { DatabaseConfig, PrometheusMetricsConfig } from '@n8n/config';
import { DbConnection, DbConnectionMetrics } from '@n8n/db';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusDbPoolMetricsService implements PrometheusMetricsCollector {
    private readonly promConfig;
    private readonly dbConfig;
    private readonly dbConnection;
    private readonly dbConnectionMetrics;
    constructor(promConfig: PrometheusMetricsConfig, dbConfig: DatabaseConfig, dbConnection: DbConnection, dbConnectionMetrics: DbConnectionMetrics);
    get enabled(): boolean;
    init(): void;
    private maxPoolSize;
}
