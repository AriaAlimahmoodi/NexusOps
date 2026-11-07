"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryExecutionResponseSender = void 0;
const result_1 = require("@n8n/utils/result");
const n8n_workflow_1 = require("n8n-workflow");
const execution_response_frame_1 = require("./execution-response-frame");
class InMemoryExecutionResponseSender {
    constructor(channel, logger, maxFrameBytes) {
        this.channel = channel;
        this.logger = logger;
        this.maxFrameBytes = maxFrameBytes;
        this.stopped = false;
    }
    send(response) {
        if (this.stopped) {
            return (0, result_1.createResultError)(new n8n_workflow_1.UnexpectedError('The execution response sender has stopped.'));
        }
        const frameResult = (0, execution_response_frame_1.serializeExecutionResponse)(response, this.logger, this.maxFrameBytes);
        this.channel.publish(response.executionId, frameResult.frame);
        return frameResult.ok ? (0, result_1.createResultOk)(undefined) : (0, result_1.createResultError)(frameResult.error);
    }
    async stop() {
        this.stopped = true;
    }
}
exports.InMemoryExecutionResponseSender = InMemoryExecutionResponseSender;
//# sourceMappingURL=in-memory-execution-response-sender.js.map