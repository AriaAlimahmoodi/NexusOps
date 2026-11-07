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
exports.InProcessEventBus = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_events_1 = require("node:events");
const constants_1 = require("../../../scaling/constants");
const publisher_service_1 = require("../../../scaling/pubsub/publisher.service");
const durable_event_log_1 = require("./durable-event-log");
let InProcessEventBus = class InProcessEventBus {
    constructor(logger, instanceSettings, publisher, eventLog) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.publisher = publisher;
        this.eventLog = eventLog;
        this.emitter = new node_events_1.EventEmitter();
        this.logger = this.logger.scoped('instance-ai');
        this.emitter.setMaxListeners(0);
    }
    publish(threadId, event) {
        if (event.ts === undefined) {
            event = { ...event, ts: Date.now() };
        }
        this.eventLog.publish(threadId, event, (drained) => this.onDrained(threadId, drained));
    }
    onDrained(threadId, drained) {
        if (!drained.live)
            return;
        const stored = {
            ...(drained.id !== undefined ? { id: drained.id } : {}),
            event: drained.event,
        };
        this.emitter.emit(threadId, stored);
        this.relayToSiblings(threadId, stored, Buffer.byteLength(JSON.stringify(drained.event), 'utf8'));
    }
    relayToSiblings(threadId, stored, sizeBytes) {
        if (!this.instanceSettings.isMultiMain)
            return;
        if (sizeBytes > constants_1.MAX_PUBSUB_PAYLOAD_BYTES) {
            this.logger.warn(`Skipping cross-main relay of "${stored.event.type}" event (${sizeBytes} bytes exceeds ${constants_1.MAX_PUBSUB_PAYLOAD_BYTES})`, { threadId, runId: stored.event.runId });
            return;
        }
        void this.publisher
            .publishCommand({
            command: 'relay-instance-ai-event',
            payload: { threadId, storedEvent: stored },
        })
            .catch((error) => this.logger.error('Failed to relay Instance AI event to sibling mains', {
            threadId,
            error,
        }));
    }
    handleRelayInstanceAiEvent({ threadId, storedEvent, }) {
        if (this.hasSubscribers(threadId))
            this.emitter.emit(threadId, storedEvent);
    }
    subscribe(threadId, handler) {
        this.emitter.on(threadId, handler);
        return () => this.emitter.off(threadId, handler);
    }
    hasSubscribers(threadId) {
        return this.emitter.listenerCount(threadId) > 0;
    }
    clearThread(threadId) {
        this.eventLog.clearThread(threadId);
        this.emitter.removeAllListeners(threadId);
    }
    clear() {
        this.eventLog.clear();
        this.emitter.removeAllListeners();
    }
};
exports.InProcessEventBus = InProcessEventBus;
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-instance-ai-event', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InProcessEventBus.prototype, "handleRelayInstanceAiEvent", null);
exports.InProcessEventBus = InProcessEventBus = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, publisher_service_1.Publisher, durable_event_log_1.DurableEventLog])
], InProcessEventBus);
//# sourceMappingURL=in-process-event-bus.js.map