"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisExecutionResponseSender = exports.SHUTDOWN_DRAIN_TIMEOUT_MS = void 0;
const result_1 = require("@n8n/utils/result");
const n8n_workflow_1 = require("n8n-workflow");
const execution_response_frame_1 = require("./execution-response-frame");
exports.SHUTDOWN_DRAIN_TIMEOUT_MS = 5_000;
class RedisExecutionResponseSender {
    constructor(publisher, getChannelName, logger) {
        this.publisher = publisher;
        this.getChannelName = getChannelName;
        this.logger = logger;
        this.stopped = false;
        this.inFlightPublishes = new Set();
    }
    send(response) {
        if (this.stopped) {
            return (0, result_1.createResultError)(new n8n_workflow_1.UnexpectedError('The execution response sender has stopped.'));
        }
        const frameResult = (0, execution_response_frame_1.serializeExecutionResponse)(response, this.logger);
        const publishTask = this.publisher
            .publish(this.getChannelName(response.executionId), frameResult.frame)
            .catch((error) => {
            this.logger.error('Failed to publish an execution response', {
                executionId: response.executionId,
                error,
            });
        })
            .finally(() => this.inFlightPublishes.delete(publishTask));
        this.inFlightPublishes.add(publishTask);
        return frameResult.ok ? (0, result_1.createResultOk)(undefined) : (0, result_1.createResultError)(frameResult.error);
    }
    async stop() {
        if (this.stopped)
            return;
        this.stopped = true;
        await this.drainInFlightPublishes();
        this.publisher.disconnect();
    }
    async drainInFlightPublishes() {
        if (this.inFlightPublishes.size === 0)
            return;
        let timer;
        const timeout = new Promise((resolve) => {
            timer = setTimeout(resolve, exports.SHUTDOWN_DRAIN_TIMEOUT_MS);
        });
        try {
            await Promise.race([Promise.allSettled(this.inFlightPublishes), timeout]);
        }
        finally {
            clearTimeout(timer);
        }
        if (this.inFlightPublishes.size > 0) {
            this.logger.warn('Execution responses were still being published at shutdown', {
                count: this.inFlightPublishes.size,
            });
        }
    }
}
exports.RedisExecutionResponseSender = RedisExecutionResponseSender;
//# sourceMappingURL=redis-execution-response-sender.js.map