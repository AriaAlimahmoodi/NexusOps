import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { DbConnection } from '@n8n/db';
import { InstanceSettings } from 'n8n-core';
import { CredentialsOverwrites } from '../credentials-overwrites';
import { ExternalHooks } from '../external-hooks';
import { PrometheusMetricsService } from '../metrics/prometheus';
import { RedisClientService } from '@n8n/backend-services';
export type WorkerServerEndpointsConfig = {
    health: boolean;
    overwrites: boolean;
    metrics: boolean;
};
export declare class WorkerServer {
    private readonly globalConfig;
    private readonly logger;
    private readonly dbConnection;
    private readonly credentialsOverwrites;
    private readonly externalHooks;
    private readonly instanceSettings;
    private readonly prometheusMetricsService;
    private readonly redisClientService;
    private readonly port;
    private readonly address;
    private readonly server;
    private readonly app;
    private endpointsConfig;
    private overwritesLoaded;
    private fullyReady;
    constructor(globalConfig: GlobalConfig, logger: Logger, dbConnection: DbConnection, credentialsOverwrites: CredentialsOverwrites, externalHooks: ExternalHooks, instanceSettings: InstanceSettings, prometheusMetricsService: PrometheusMetricsService, redisClientService: RedisClientService);
    markAsReady(): void;
    init(endpointsConfig: WorkerServerEndpointsConfig): Promise<void>;
    private mountEndpoints;
    private readiness;
    private handleOverwrites;
}
