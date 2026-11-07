"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageEventBusDestination = createMessageEventBusDestination;
const n8n_workflow_1 = require("n8n-workflow");
const message_event_bus_destination_sentry_ee_1 = require("./destinations/message-event-bus-destination-sentry.ee");
const message_event_bus_destination_syslog_ee_1 = require("./destinations/message-event-bus-destination-syslog.ee");
const message_event_bus_destination_webhook_ee_1 = require("./destinations/message-event-bus-destination-webhook.ee");
function createMessageEventBusDestination(eventBus, outboundHttp, options) {
    switch (options.__type) {
        case "$$MessageEventBusDestinationWebhook":
            return new message_event_bus_destination_webhook_ee_1.MessageEventBusDestinationWebhook(eventBus, options, outboundHttp);
        case "$$MessageEventBusDestinationSentry":
            return new message_event_bus_destination_sentry_ee_1.MessageEventBusDestinationSentry(eventBus, options);
        case "$$MessageEventBusDestinationSyslog":
            return new message_event_bus_destination_syslog_ee_1.MessageEventBusDestinationSyslog(eventBus, options);
        default:
            throw new n8n_workflow_1.UnexpectedError(`Unknown destination type: ${options.__type ?? 'undefined'}`);
    }
}
//# sourceMappingURL=create-message-event-bus-destination.js.map