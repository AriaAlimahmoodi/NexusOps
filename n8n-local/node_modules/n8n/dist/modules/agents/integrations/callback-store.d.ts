import { type LockService } from '@n8n/backend-common';
import type { CacheService } from '@n8n/backend-services';
export interface CallbackPayload {
    actionId: string;
    value: string;
    groupId?: string;
    label?: string;
}
export type CallbackMetadata = Pick<CallbackPayload, 'groupId'>;
type CallbackStoreMetadata = CallbackMetadata & Pick<CallbackPayload, 'label'>;
export declare class CallbackStore {
    private readonly cache;
    private readonly lockService;
    private readonly scope;
    private readonly ttlMs;
    constructor(cache: CacheService, lockService: LockService, scope: string, ttlMs?: number);
    store(actionId: string, value: string, metadata?: CallbackStoreMetadata): Promise<string>;
    resolve(key: string): Promise<CallbackPayload | undefined>;
    private entryCacheKey;
    private groupCacheKey;
}
export {};
