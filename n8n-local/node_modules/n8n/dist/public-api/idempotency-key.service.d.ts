import { IdempotencyKeyRepository } from '@n8n/db';
import type { IdempotencyClaim, IdempotencyStore } from '../idempotency/idempotency.types';
export declare const CLEANUP_BATCH_SIZE = 500;
export declare class IdempotencyKeyService implements IdempotencyStore {
    private readonly idempotencyKeyRepository;
    constructor(idempotencyKeyRepository: IdempotencyKeyRepository);
    claim(input: {
        userId: string;
        idempotencyKey: string;
        fingerprint: string;
    }): Promise<IdempotencyClaim>;
    complete(id: string, responseStatus: number, responseBody: unknown): Promise<void>;
    release(id: string): Promise<void>;
    deleteOlderThan(cutoff: Date, signal: AbortSignal): Promise<number>;
}
