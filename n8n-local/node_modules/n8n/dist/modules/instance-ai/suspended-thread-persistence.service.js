"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspendedThreadPersistenceService = void 0;
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
class SuspendedThreadPersistenceService {
    constructor(options) {
        this.logger = options.logger;
        this.config = options.config;
        this.pendingConfirmationRepo = options.pendingConfirmationRepo;
    }
    async pruneStalePendingConfirmations(now) {
        try {
            const count = await this.pendingConfirmationRepo.deleteExpired(new Date(now));
            if (count === 0) {
                this.logger.debug('No stale Instance AI pending confirmations to drop');
                return;
            }
            this.logger.info('Dropped stale Instance AI pending confirmations', { count });
        }
        catch (error) {
            this.logger.warn('Failed to drop stale Instance AI pending confirmations', {
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    computePendingConfirmationExpiresAt() {
        const timeoutMs = this.config.confirmationTimeout;
        return timeoutMs > 0 ? new Date(Date.now() + timeoutMs) : null;
    }
    async persistPendingConfirmation(params) {
        try {
            await this.pendingConfirmationRepo.save(this.pendingConfirmationRepo.create({
                requestId: params.requestId,
                threadId: params.threadId,
                userId: params.userId,
                kind: params.kind,
                runId: params.runId,
                messageGroupId: params.messageGroupId ?? null,
                toolCallId: params.toolCallId ?? null,
                checkpointKey: params.checkpointKey ?? null,
                checkpointTaskId: params.checkpointTaskId ?? null,
                expiresAt: this.computePendingConfirmationExpiresAt(),
            }));
        }
        catch (error) {
            this.logger.warn('Failed to persist pending confirmation', {
                requestId: params.requestId,
                threadId: params.threadId,
                kind: params.kind,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    async dropPendingConfirmation(requestId) {
        try {
            await this.pendingConfirmationRepo.deleteByRequestId(requestId);
        }
        catch (error) {
            this.logger.warn('Failed to drop pending confirmation', {
                requestId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    async dropPendingConfirmationsForThread(threadId) {
        try {
            await this.pendingConfirmationRepo.deleteByThreadId(threadId);
        }
        catch (error) {
            this.logger.warn('Failed to drop pending confirmations for thread', {
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
}
exports.SuspendedThreadPersistenceService = SuspendedThreadPersistenceService;
//# sourceMappingURL=suspended-thread-persistence.service.js.map