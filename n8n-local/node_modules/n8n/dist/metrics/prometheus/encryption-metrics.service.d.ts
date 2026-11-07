import { PrometheusMetricsConfig } from '@n8n/config';
import { Cipher } from 'n8n-core';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusEncryptionMetricsService implements PrometheusMetricsCollector {
    private readonly cipher;
    private readonly config;
    constructor(cipher: Cipher, config: PrometheusMetricsConfig);
    get enabled(): boolean;
    init(): void;
}
