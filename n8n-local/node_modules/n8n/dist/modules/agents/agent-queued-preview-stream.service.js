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
var AgentQueuedPreviewStreamService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentQueuedPreviewStreamService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const n8n_core_1 = require("n8n-core");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const subscriber_service_1 = require("../../scaling/pubsub/subscriber.service");
const agent_message_queue_repository_1 = require("./repositories/agent-message-queue.repository");
let AgentQueuedPreviewStreamService = AgentQueuedPreviewStreamService_1 = class AgentQueuedPreviewStreamService {
    constructor(publisher, instanceSettings, repository, logger, subscriber) {
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.repository = repository;
        this.logger = logger;
        this.listeners = new Map();
        this.stopRelays = new Set();
        if (!this.instanceSettings.isMultiMain)
            return;
        subscriber.getClient().on('close', () => {
            for (const listener of this.listeners.values())
                listener.close();
        });
        this.publisher.getClient().on('close', () => {
            for (const stop of this.stopRelays)
                stop();
        });
    }
    subscribe(queueId, stream) {
        const done = (0, deferred_promise_1.createDeferredPromise)();
        const close = () => {
            this.listeners.delete(queueId);
            stream.abortSignal.removeEventListener('abort', close);
            stream.close();
            done.resolve();
        };
        const listener = { accepted: false, sequence: 0, send: stream.send, close };
        this.listeners.set(queueId, listener);
        stream.abortSignal.addEventListener('abort', close, { once: true });
        if (stream.abortSignal.aborted)
            close();
        return {
            done: done.promise,
            close,
            accepted: () => {
                listener.accepted = true;
            },
        };
    }
    createSender(queueId) {
        let sequence = 0;
        let pending = Promise.resolve();
        let failed = false;
        let heartbeat;
        const stopped = (0, deferred_promise_1.createDeferredPromise)();
        const stop = () => {
            failed = true;
            clearInterval(heartbeat);
            this.listeners.get(queueId)?.close();
            stopped.resolve();
        };
        if (this.instanceSettings.isMultiMain) {
            this.stopRelays.add(stop);
            if (this.publisher.getClient().status !== 'ready')
                stop();
        }
        const send = (event) => {
            if (failed)
                return;
            const payload = { queueId, sequence: ++sequence, event };
            this.handleRelay(payload);
            if (!this.instanceSettings.isMultiMain)
                return;
            pending = pending
                .then(async () => {
                if (!failed)
                    await this.publisher.publishCommand({ command: 'relay-agent-queued-chat', payload });
            })
                .catch((error) => {
                stop();
                this.logger.warn('Failed to relay queued agent output', { queueId, error });
            });
        };
        if (this.instanceSettings.isMultiMain && !failed) {
            heartbeat = setInterval(() => send(undefined), AgentQueuedPreviewStreamService_1.RELAY_HEARTBEAT_MS);
            heartbeat.unref();
        }
        return {
            send: (event) => send(event),
            close: async () => {
                clearInterval(heartbeat);
                send(null);
                await Promise.race([pending, stopped.promise]);
                this.stopRelays.delete(stop);
            },
        };
    }
    handleRelay({ queueId, sequence, event }) {
        const listener = this.listeners.get(queueId);
        if (!listener || sequence <= listener.sequence)
            return;
        if (sequence !== listener.sequence + 1 || event === null) {
            listener.close();
            return;
        }
        listener.sequence = sequence;
        listener.recoveryDeadline = undefined;
        listener.relayDeadline = Date.now() + AgentQueuedPreviewStreamService_1.RELAY_TIMEOUT_MS;
        if (event !== undefined)
            listener.send(event);
    }
    async closeSettledStreams() {
        for (const [id, listener] of this.listeners) {
            if (!listener.accepted)
                continue;
            const item = await this.repository.findDeliveryState(id);
            if (item && (!item.execution || item.execution.status === 'running')) {
                listener.recoveryDeadline = undefined;
                if (item.execution && this.instanceSettings.isMultiMain) {
                    listener.relayDeadline ??= Date.now() + AgentQueuedPreviewStreamService_1.RELAY_TIMEOUT_MS;
                    if (Date.now() >= listener.relayDeadline)
                        listener.close();
                }
                continue;
            }
            listener.recoveryDeadline ??= Date.now() + AgentQueuedPreviewStreamService_1.RECOVERY_GRACE_MS;
            if (Date.now() >= listener.recoveryDeadline)
                listener.close();
        }
    }
};
exports.AgentQueuedPreviewStreamService = AgentQueuedPreviewStreamService;
AgentQueuedPreviewStreamService.RECOVERY_GRACE_MS = 10_000;
AgentQueuedPreviewStreamService.RELAY_HEARTBEAT_MS = 5_000;
AgentQueuedPreviewStreamService.RELAY_TIMEOUT_MS = 30_000;
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-agent-queued-chat', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentQueuedPreviewStreamService.prototype, "handleRelay", null);
exports.AgentQueuedPreviewStreamService = AgentQueuedPreviewStreamService = AgentQueuedPreviewStreamService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [publisher_service_1.Publisher, n8n_core_1.InstanceSettings, agent_message_queue_repository_1.AgentMessageQueueRepository, backend_common_1.Logger, subscriber_service_1.Subscriber])
], AgentQueuedPreviewStreamService);
//# sourceMappingURL=agent-queued-preview-stream.service.js.map