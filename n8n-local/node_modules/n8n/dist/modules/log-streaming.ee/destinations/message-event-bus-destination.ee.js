"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageEventBusDestination = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const uuid_1 = require("uuid");
const event_message_generic_1 = require("../../../eventbus/event-message-classes/event-message-generic");
const circuit_breaker_1 = require("../../../utils/circuit-breaker");
class MessageEventBusDestination {
    constructor(eventBusInstance, options) {
        this.credentials = {};
        this.logger = di_1.Container.get(backend_common_1.Logger);
        const timeout = options.circuitBreaker?.maxDuration ?? constants_1.LOGSTREAMING_CB_DEFAULT_MAX_DURATION_MS;
        const maxFailures = options.circuitBreaker?.maxFailures ?? constants_1.LOGSTREAMING_CB_DEFAULT_MAX_FAILURES;
        const halfOpenRequests = options.circuitBreaker?.halfOpenRequests ?? constants_1.LOGSTREAMING_CB_DEFAULT_HALF_OPEN_REQUESTS;
        const failureWindow = options.circuitBreaker?.failureWindow ?? constants_1.LOGSTREAMING_CB_DEFAULT_FAILURE_WINDOW_MS;
        const maxConcurrentHalfOpenRequests = options.circuitBreaker?.maxConcurrentHalfOpenRequests ??
            constants_1.LOGSTREAMING_CB_DEFAULT_CONCURRENT_HALF_OPEN_REQUESTS;
        this.circuitBreakerInstance = new circuit_breaker_1.CircuitBreaker({
            timeout,
            maxFailures,
            halfOpenRequests,
            failureWindow,
            maxConcurrentHalfOpenRequests,
        });
        this.circuitBreakerOptions = options.circuitBreaker;
        this.eventBusInstance = eventBusInstance;
        this.id = !options.id || options.id.length !== 36 ? (0, uuid_1.v4)() : options.id;
        this.__type = options.__type ?? "$$AbstractMessageEventBusDestination";
        this.label = options.label ?? 'Log Destination';
        this.enabled = options.enabled ?? false;
        this.subscribedEvents = options.subscribedEvents ?? [];
        this.anonymizeAuditMessages = options.anonymizeAuditMessages ?? false;
        if (options.credentials)
            this.credentials = options.credentials;
        this.logger.debug(`${this.__type}(${this.id}) event destination constructed`);
    }
    getId() {
        return this.id;
    }
    hasSubscribedToEvent(msg) {
        if (!this.enabled)
            return false;
        for (const eventName of this.subscribedEvents) {
            if (eventName === '*' || msg.eventName.startsWith(eventName)) {
                return true;
            }
        }
        return false;
    }
    serialize() {
        return {
            __type: this.__type,
            id: this.getId(),
            label: this.label,
            enabled: this.enabled,
            subscribedEvents: this.subscribedEvents,
            anonymizeAuditMessages: this.anonymizeAuditMessages,
            circuitBreaker: this.circuitBreakerOptions,
        };
    }
    async sendMessage(emitterPayload) {
        const { msg } = emitterPayload;
        if (msg.eventName !== event_message_generic_1.eventMessageGenericDestinationTestEvent) {
            if (!this.hasSubscribedToEvent(msg))
                return false;
        }
        return await this.circuitBreakerInstance.execute(async () => {
            return await this.receiveFromEventBus(emitterPayload);
        });
    }
    toString() {
        return JSON.stringify(this.serialize());
    }
    async close() {
        this.enabled = false;
    }
}
exports.MessageEventBusDestination = MessageEventBusDestination;
//# sourceMappingURL=message-event-bus-destination.ee.js.map