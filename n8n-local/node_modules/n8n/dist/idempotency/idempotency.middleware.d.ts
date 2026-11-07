import type { RequestHandler, Response } from 'express';
import type { IdempotencyStore } from '../idempotency/idempotency.types';
export declare const IDEMPOTENCY_KEY_INVALID_MESSAGE = "Idempotency-Key must be 1 to 128 visible ASCII characters.";
export declare const IDEMPOTENCY_KEY_IN_PROGRESS_MESSAGE = "A request with this Idempotency-Key is already in progress.";
export declare const IDEMPOTENCY_KEY_MISMATCH_MESSAGE = "This Idempotency-Key was already used with a different request.";
export declare function createIdempotencyMiddleware(store: IdempotencyStore): RequestHandler;
export declare function takeIdempotencyClaimId(res: Response): string | undefined;
