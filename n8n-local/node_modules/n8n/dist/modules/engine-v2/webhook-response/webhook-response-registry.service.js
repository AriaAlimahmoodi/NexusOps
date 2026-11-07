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
exports.EngineV2WebhookResponseRegistry = exports.SUBSCRIBE_TIMEOUT_MS = exports.MAX_PENDING_WEBHOOKS = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const n8n_workflow_1 = require("n8n-workflow");
const streaming_response_writer_1 = require("./streaming-response-writer");
const webhook_outcome_1 = require("./webhook-outcome");
exports.MAX_PENDING_WEBHOOKS = 5000;
exports.SUBSCRIBE_TIMEOUT_MS = 30_000;
let EngineV2WebhookResponseRegistry = class EngineV2WebhookResponseRegistry {
    constructor(engineConfig, logger) {
        this.engineConfig = engineConfig;
        this.logger = logger;
        this.pendingWebhooks = new Map();
        this.logger = this.logger.scoped('engine-v2');
    }
    useReceiver(receiver) {
        if (this.receiver) {
            throw new n8n_workflow_1.UnexpectedError('Engine v2 webhook response receiver is already set');
        }
        this.receiver = receiver;
    }
    async waitForResponse(executionId, expectation, responseStream) {
        const { receiver } = this;
        if (!receiver) {
            throw new n8n_workflow_1.UnexpectedError('Engine v2 cannot wait for a response without a receiver');
        }
        if (this.pendingWebhooks.size >= exports.MAX_PENDING_WEBHOOKS) {
            throw new n8n_workflow_1.OperationalError(`Engine v2 already awaits ${exports.MAX_PENDING_WEBHOOKS} webhook responses. Try again later.`);
        }
        if (this.pendingWebhooks.has(executionId)) {
            throw new n8n_workflow_1.UnexpectedError('Engine v2 already waits for a response for this execution', {
                extra: { executionId },
            });
        }
        if (expectation.kind === 'stream' && !responseStream) {
            throw new n8n_workflow_1.UnexpectedError('Engine v2 cannot stream a response without a response stream', {
                extra: { executionId },
            });
        }
        const pending = {
            executionId,
            expectation,
            answer: (0, deferred_promise_1.createDeferredPromise)(),
            timeoutTimer: setTimeout(() => this.settle(pending, { status: 'timeout' }), this.engineConfig.webhookResponseTimeout).unref(),
            released: false,
            writer: expectation.kind === 'stream' && responseStream
                ? new streaming_response_writer_1.StreamingResponseWriter(responseStream)
                : undefined,
        };
        this.pendingWebhooks.set(executionId, pending);
        await this.subscribe(receiver, pending);
        return {
            executionId,
            outcome: pending.answer.promise,
            release: () => this.release(pending),
        };
    }
    async subscribe(receiver, pending) {
        const { executionId } = pending;
        const subscription = receiver.receive(executionId, (received) => this.handle(received, pending));
        let subscribeTimeoutTimer;
        const timedOut = new Promise((resolve) => {
            subscribeTimeoutTimer = setTimeout(() => resolve('timed-out'), exports.SUBSCRIBE_TIMEOUT_MS).unref();
        });
        let result;
        try {
            result = await Promise.race([subscription, timedOut]);
        }
        catch (error) {
            this.release(pending);
            throw error;
        }
        finally {
            clearTimeout(subscribeTimeoutTimer);
        }
        if (result === 'timed-out') {
            this.release(pending);
            void subscription.then((unsubscribe) => unsubscribe(), () => { });
            throw new n8n_workflow_1.OperationalError(`Engine v2 could not listen for the execution response within ${exports.SUBSCRIBE_TIMEOUT_MS / 1000}s.`, { extra: { executionId } });
        }
        const unsubscribe = result;
        if (pending.released) {
            unsubscribe();
            return;
        }
        pending.unsubscribe = unsubscribe;
    }
    handle(received, pending) {
        if (pending.released)
            return;
        try {
            if (received.type === 'chunk' && pending.writer) {
                pending.writer.writeChunk(received.payload);
                pending.timeoutTimer.refresh();
            }
            const outcome = (0, webhook_outcome_1.toWebhookOutcome)(received, pending.expectation);
            if (outcome)
                this.settle(pending, outcome);
        }
        catch (error) {
            this.logger.error('Failed to relay an engine v2 response', {
                executionId: received.executionId,
                type: received.type,
                error,
            });
        }
    }
    settle(pending, outcome) {
        if (pending.released)
            return;
        try {
            pending.writer?.finish(outcome);
        }
        catch (error) {
            this.logger.error('Failed to end an engine v2 webhook stream', {
                executionId: pending.executionId,
                error,
            });
        }
        pending.answer.resolve(outcome);
        this.release(pending);
    }
    release(pending) {
        if (pending.released)
            return;
        pending.released = true;
        clearTimeout(pending.timeoutTimer);
        pending.writer?.stop();
        pending.unsubscribe?.();
        this.pendingWebhooks.delete(pending.executionId);
    }
};
exports.EngineV2WebhookResponseRegistry = EngineV2WebhookResponseRegistry;
exports.EngineV2WebhookResponseRegistry = EngineV2WebhookResponseRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.EngineConfig, backend_common_1.Logger])
], EngineV2WebhookResponseRegistry);
//# sourceMappingURL=webhook-response-registry.service.js.map