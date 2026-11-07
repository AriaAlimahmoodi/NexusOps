import { type InstanceRegistration } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { RedisClientService } from '@n8n/backend-services';
import type { InstanceStorage } from './instance-storage.interface';
export declare class RedisInstanceStorage implements InstanceStorage {
    readonly kind: 'redis';
    private readonly logger;
    private readonly redisPrefix;
    private readonly redisClient;
    constructor(logger: Logger, globalConfig: GlobalConfig, redisClientService: RedisClientService);
    register(registration: InstanceRegistration): Promise<void>;
    heartbeat(registration: InstanceRegistration): Promise<void>;
    unregister(instanceKey: string): Promise<void>;
    getAllRegistrations(): Promise<InstanceRegistration[]>;
    getRegistration(instanceKey: string): Promise<InstanceRegistration | null>;
    getLastKnownState(): Promise<Map<string, InstanceRegistration>>;
    saveLastKnownState(state: Map<string, InstanceRegistration>): Promise<void>;
    cleanupStaleMembers(): Promise<number>;
    destroy(): Promise<void>;
    private upsertRegistration;
    private instanceKey;
    private membershipSetKey;
    private stateKey;
}
