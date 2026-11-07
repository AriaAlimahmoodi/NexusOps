"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryExecutionResponseReceiver = void 0;
const execution_response_frame_1 = require("./execution-response-frame");
class InMemoryExecutionResponseReceiver {
    constructor(channel, logger) {
        this.channel = channel;
        this.logger = logger;
        this.subscriptions = new Set();
        this.stopped = false;
    }
    async receive(executionId, handler) {
        if (this.stopped)
            return () => { };
        const unsubscribeFromChannel = this.channel.subscribe(executionId, (frame) => {
            const responseResult = (0, execution_response_frame_1.deserializeExecutionResponse)(frame, this.logger);
            if (!responseResult.ok)
                return;
            const response = responseResult.result;
            try {
                handler(response);
            }
            catch (error) {
                this.logger.error('A response handler threw', {
                    executionId: response.executionId,
                    type: response.type,
                    error,
                });
            }
        });
        const unsubscribe = () => {
            unsubscribeFromChannel();
            this.subscriptions.delete(unsubscribe);
        };
        this.subscriptions.add(unsubscribe);
        return unsubscribe;
    }
    async stop() {
        this.stopped = true;
        for (const unsubscribe of this.subscriptions)
            unsubscribe();
    }
}
exports.InMemoryExecutionResponseReceiver = InMemoryExecutionResponseReceiver;
//# sourceMappingURL=in-memory-execution-response-receiver.js.map