import { type ILockService, type LockNamespace, Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { RedisClientService } from '@n8n/backend-services';
export declare class RedisLockService implements ILockService {
    private readonly logger;
    private readonly redisClient;
    private readonly lockPrefix;
    constructor(logger: Logger, globalConfig: GlobalConfig, redisClientService: RedisClientService);
    private buildLockKey;
    withLease<T>(ns: LockNamespace, key: string, fn: (signal: AbortSignal) => Promise<T>, options?: {
        waitTimeoutMs?: number;
        leaseTtlMs?: number;
    }): Promise<T>;
    destroy(): void;
}
