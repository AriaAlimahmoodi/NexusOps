import { PrometheusMetricsConfig } from '@n8n/config';
import type { PrometheusMetricsCollector } from './base';
export declare class PrometheusWebhookAndFormMetricsService implements PrometheusMetricsCollector {
    private readonly config;
    private webhookHistogram?;
    private formHistogram?;
    constructor(config: PrometheusMetricsConfig);
    get enabled(): boolean;
    init(): void;
    observeWebhookRequest(observation: {
        method: string;
        statusCode: number;
        webhookPath: string;
        workflowId: string;
        durationSeconds: number;
    }): void;
    observeFormSubmission(observation: {
        statusCode: number;
        formPath: string;
        workflowId: string;
        durationSeconds: number;
    }): void;
}
