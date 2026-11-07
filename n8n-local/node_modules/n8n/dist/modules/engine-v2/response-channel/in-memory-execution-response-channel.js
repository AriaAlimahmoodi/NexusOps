"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryExecutionResponseChannel = void 0;
const node_events_1 = require("node:events");
class InMemoryExecutionResponseChannel {
    constructor() {
        this.emitter = new node_events_1.EventEmitter();
    }
    publish(executionId, frame) {
        this.emitter.emit(executionId, frame);
    }
    subscribe(executionId, handler) {
        this.emitter.on(executionId, handler);
        return () => this.emitter.off(executionId, handler);
    }
}
exports.InMemoryExecutionResponseChannel = InMemoryExecutionResponseChannel;
//# sourceMappingURL=in-memory-execution-response-channel.js.map