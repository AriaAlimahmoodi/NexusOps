"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspendedRunRestorer = void 0;
const instance_ai_1 = require("@n8n/instance-ai");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const n8n_workflow_1 = require("n8n-workflow");
class SuspendedRunRestorer {
    constructor(options) {
        this.logger = options.logger;
        this.pendingConfirmationRepo = options.pendingConfirmationRepo;
        this.runState = options.runState;
        this.eventBus = options.eventBus;
        this.rebuilder = options.rebuilder;
    }
    async resolveOrphanedConfirmation(userId, requestId, data) {
        let orphan;
        try {
            orphan = await this.pendingConfirmationRepo.claim(requestId, userId);
        }
        catch (error) {
            this.logger.warn('Failed to claim orphaned pending confirmation', {
                requestId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return null;
        }
        if (!orphan)
            return null;
        if (this.runState.hasLiveRun(orphan.threadId)) {
            this.logger.warn('Rejecting stale pending confirmation: thread already has a live run', {
                requestId,
                threadId: orphan.threadId,
                runId: orphan.runId,
                kind: orphan.kind,
            });
            return null;
        }
        this.logger.info('Reclaiming pending confirmation orphaned by a process restart', {
            requestId,
            threadId: orphan.threadId,
            runId: orphan.runId,
            kind: orphan.kind,
            hasCheckpoint: Boolean(orphan.checkpointKey),
        });
        if (orphan.kind === 'suspended' && this.canResumeOrphan(orphan)) {
            const resumed = await this.tryResumeFromOrphan(orphan, data);
            if (resumed) {
                return resumed;
            }
        }
        this.finalizeUnresumableOrphan(orphan);
        throw new n8n_workflow_1.UserError('This confirmation was lost when the assistant restarted. Send a new message to continue.');
    }
    canResumeOrphan(orphan) {
        return Boolean(orphan.toolCallId && orphan.checkpointKey);
    }
    finalizeUnresumableOrphan(orphan) {
        try {
            this.publishRunFinish(orphan.threadId, orphan.runId, 'restart_lost_confirmation');
        }
        catch (error) {
            this.logger.warn('Failed to finalize orphaned confirmation', {
                requestId: orphan.requestId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    publishRunFinish(threadId, runId, reason) {
        this.eventBus.publish(threadId, {
            type: 'run-finish',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            payload: { status: 'cancelled', reason },
        });
    }
    async tryResumeFromOrphan(orphan, data) {
        const outcome = await this.rebuilder.rebuildSuspendedRun(orphan);
        switch (outcome.kind) {
            case 'ready':
                this.runState.suspendRun(orphan.threadId, outcome.state);
                return await this.rebuilder.resumeSuspendedRun(orphan.userId, orphan.requestId, data);
            case 'no-user':
                this.logger.warn('Cannot resume orphaned run: user no longer authorized', {
                    requestId: orphan.requestId,
                    userId: orphan.userId,
                });
                return null;
            case 'no-checkpoint':
                this.logger.warn('Cannot resume orphaned run: checkpoint missing or unavailable', {
                    requestId: orphan.requestId,
                    checkpointKey: orphan.checkpointKey,
                    ...(outcome.error ? { error: (0, get_error_message_1.getErrorMessage)(outcome.error) } : {}),
                });
                return null;
            case 'env-failure':
                this.logger.warn('Cannot resume orphaned run: failed to build execution environment', {
                    requestId: orphan.requestId,
                    threadId: orphan.threadId,
                    error: (0, get_error_message_1.getErrorMessage)(outcome.error),
                });
                return null;
            case 'agent-failure':
                this.logger.warn('Cannot resume orphaned run: failed to build agent', {
                    requestId: orphan.requestId,
                    threadId: orphan.threadId,
                    error: (0, get_error_message_1.getErrorMessage)(outcome.error),
                });
                return null;
        }
    }
}
exports.SuspendedRunRestorer = SuspendedRunRestorer;
//# sourceMappingURL=suspended-run-restorer.service.js.map