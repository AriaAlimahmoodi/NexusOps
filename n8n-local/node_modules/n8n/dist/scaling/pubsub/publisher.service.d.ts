import { Logger } from '@n8n/backend-common';
import { ExecutionsConfig, GlobalConfig } from '@n8n/config';
import type { Redis as SingleNodeClient, Cluster as MultiNodeClient } from 'ioredis';
import { InstanceSettings } from 'n8n-core';
import { RedisClientService } from '@n8n/backend-services';
import type { PubSub } from './pubsub.types';
import type { McpRelayMessage } from './subscriber.service';
export declare class Publisher {
    private readonly logger;
    private readonly redisClientService;
    private readonly instanceSettings;
    private readonly executionsConfig;
    private readonly globalConfig;
    private readonly client;
    private readonly commandChannel;
    private readonly workerResponseChannel;
    private readonly mcpRelayChannel;
    constructor(logger: Logger, redisClientService: RedisClientService, instanceSettings: InstanceSettings, executionsConfig: ExecutionsConfig, globalConfig: GlobalConfig);
    getClient(): MultiNodeClient | SingleNodeClient;
    shutdown(): void;
    publishCommand(msg: PubSub.Command): Promise<void>;
    publishWorkerResponse(msg: PubSub.WorkerResponse): Promise<void>;
    publishMcpRelay(msg: McpRelayMessage): Promise<void>;
    setIfNotExists(key: string, value: string, ttl: number): Promise<boolean>;
    set(key: string, value: string, ttl: number): Promise<void>;
    setExpiration(key: string, ttl: number): Promise<void>;
    get(key: string): Promise<string | null>;
    clear(key: string): Promise<void>;
}
