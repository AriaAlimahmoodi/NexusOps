import { Logger } from '@n8n/backend-common';
import { ExpressionEngineConfig, GlobalConfig } from '@n8n/config';
import type { LogsAPI, MetricsAPI, ObservabilityProvider, TracesAPI } from '@n8n/expression-runtime';
import { OtelService } from '../modules/otel/otel.service';
export declare class ExpressionObservabilityProvider implements ObservabilityProvider {
    private readonly config;
    private readonly logger;
    private readonly otelService;
    readonly metrics: MetricsAPI;
    readonly traces: TracesAPI;
    readonly logs: LogsAPI;
    private readonly scopedLogger;
    private readonly prefix;
    private readonly metricDefs;
    constructor(config: ExpressionEngineConfig, logger: Logger, globalConfig: GlobalConfig, otelService: OtelService);
    private getOrRegisterMetric;
    private getMetricDef;
    private counter;
    private gauge;
    private histogram;
    private maybeRecordSpan;
    private tailSample;
    private startSpan;
}
