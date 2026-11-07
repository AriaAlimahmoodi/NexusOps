"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMessageMcp = void 0;
const abstract_event_message_1 = require("./abstract-event-message");
class EventMessageMcp extends abstract_event_message_1.AbstractEventMessage {
    constructor(options) {
        super(options);
        this.__type = "$$EventMessageMcp";
        if (options.payload)
            this.setPayload(options.payload);
        if (options.anonymize) {
            this.anonymize();
        }
    }
    setPayload(payload) {
        this.payload = payload;
        return this;
    }
}
exports.EventMessageMcp = EventMessageMcp;
//# sourceMappingURL=event-message-mcp.js.map