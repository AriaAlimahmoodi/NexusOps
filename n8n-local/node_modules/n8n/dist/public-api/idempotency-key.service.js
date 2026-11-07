"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyKeyService = exports.CLEANUP_BATCH_SIZE = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
exports.CLEANUP_BATCH_SIZE = 500;
const CLAIM_ATTEMPTS = 3;
let IdempotencyKeyService = class IdempotencyKeyService {
    constructor(idempotencyKeyRepository) {
        this.idempotencyKeyRepository = idempotencyKeyRepository;
    }
    async claim(input) {
        const cutoff = new Date(Date.now() - db_1.IDEMPOTENCY_KEY_TTL_MS);
        for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt++) {
            const insertedId = await this.idempotencyKeyRepository.insertProcessing(input);
            if (insertedId)
                return { outcome: 'claimed', id: insertedId };
            const existing = await this.idempotencyKeyRepository.findByUserIdAndKey(input.userId, input.idempotencyKey);
            if (!existing)
                continue;
            if (createdAtMs(existing.createdAt) < cutoff.getTime()) {
                await this.idempotencyKeyRepository.deleteByUserIdAndKeyOlderThan(input.userId, input.idempotencyKey, cutoff);
                continue;
            }
            if (existing.fingerprint !== input.fingerprint)
                return { outcome: 'mismatch' };
            if (existing.status === 'processing' || existing.responseStatus === null) {
                return { outcome: 'processing' };
            }
            return {
                outcome: 'replay',
                responseStatus: existing.responseStatus,
                responseBody: existing.responseBody,
            };
        }
        throw new n8n_workflow_1.UnexpectedError('Failed to claim an idempotency key');
    }
    async complete(id, responseStatus, responseBody) {
        await this.idempotencyKeyRepository.markCompleted(id, responseStatus, responseBody);
    }
    async release(id) {
        await this.idempotencyKeyRepository.deleteProcessingById(id);
    }
    async deleteOlderThan(cutoff, signal) {
        let total = 0;
        let deleted;
        do {
            deleted = await this.idempotencyKeyRepository.deleteOlderThan(cutoff, exports.CLEANUP_BATCH_SIZE);
            total += deleted;
        } while (deleted >= exports.CLEANUP_BATCH_SIZE && !signal.aborted);
        return total;
    }
};
exports.IdempotencyKeyService = IdempotencyKeyService;
exports.IdempotencyKeyService = IdempotencyKeyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.IdempotencyKeyRepository])
], IdempotencyKeyService);
function createdAtMs(value) {
    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (Number.isNaN(time)) {
        throw new n8n_workflow_1.UnexpectedError('Idempotency key createdAt is not a valid time');
    }
    return time;
}
//# sourceMappingURL=idempotency-key.service.js.map