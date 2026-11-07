import { Logger } from '@n8n/backend-common';
import { ExecutionsConfig, GlobalConfig } from '@n8n/config';
import type { Redis as SingleNodeClient, Cluster as MultiNodeClient } from 'ioredis';
import { InstanceSettings } from 'n8n-core';
import { RedisClientService } from '@n8n/backend-services';
import { PubSubEventBus } from './pubsub.eventbus';
export interface McpRelayMessage {
    sessionId: string;
    messageId: string;
    response: unknown;
}
export declare class Subscriber {
    private readonly logger;
    private readonly instanceSettings;
    private readonly pubsubEventBus;
    private readonly redisClientService;
    private readonly executionsConfig;
    private readonly globalConfig;
    private readonly client;
    private readonly commandChannel;
    private readonly workerResponseChannel;
    private readonly mcpRelayChannel;
    private mcpRelayHandler?;
    private readonly debouncedHandlers;
    private readonly channels;
    private lostConnection;
    private livenessTimer?;
    constructor(logger: Logger, instanceSettings: InstanceSettings, pubsubEventBus: PubSubEventBus, redisClientService: RedisClientService, executionsConfig: ExecutionsConfig, globalConfig: GlobalConfig);
    setMcpRelayHandler(handler: (msg: McpRelayMessage) => void): void;
    private handleMcpRelayMessage;
    getClient(): MultiNodeClient | SingleNodeClient;
    getCommandChannel(): string;
    getWorkerResponseChannel(): string;
    getMcpRelayChannel(): string;
    shutdown(): void;
    subscribe(channel: string): Promise<void>;
    private resubscribe;
    private checkLiveness;
    private eventNameFrom;
    private debounceKeyFrom;
    private parseMessage;
}
