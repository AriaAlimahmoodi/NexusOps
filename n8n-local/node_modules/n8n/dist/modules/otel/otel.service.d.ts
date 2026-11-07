import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { Tracer } from '@opentelemetry/api';
import { InstanceSettings } from 'n8n-core';
import type { OtelConnectionParams } from './otel-settings.service';
import { OtelSettingsService } from './otel-settings.service';
export type OtelTestTraceResult = {
    success: true;
} | {
    success: false;
    error: string;
};
export declare class OtelService {
    private readonly otelSettingsService;
    private readonly instanceSettings;
    private readonly logger;
    private readonly outboundHttp;
    private static isDiagnosticsLoggerConfigured;
    private provider?;
    private ownsGlobalApi;
    private hasLoggedForeignGlobalApiOwner;
    constructor(otelSettingsService: OtelSettingsService, instanceSettings: InstanceSettings, logger: Logger, outboundHttp: OutboundHttp);
    init(): Promise<void>;
    restart(): Promise<void>;
    getTracer(name: string): Tracer;
    sendTestTrace(connection: OtelConnectionParams): Promise<OtelTestTraceResult>;
    private start;
    shutdown(): Promise<void>;
    private startProvider;
    private buildResource;
    private registerGlobalApi;
    private logForeignGlobalApiOwner;
    private createTraceExporter;
    private createHttpTraceExporter;
    private createGrpcTraceExporter;
    private resolveExporterUrl;
    private toGrpcMetadata;
    parseOtlpHeaders(headersToSplit: string): Record<string, string>;
    private configureDiagnosticsLogger;
    private buildOtlpTracesUrl;
    private checkEndpointReachability;
    private probeHttpEndpoint;
    private probeGrpcEndpoint;
}
