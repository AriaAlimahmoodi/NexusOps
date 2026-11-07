"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingResponseWriter = void 0;
const streaming_webhook_response_heartbeat_1 = require("../../../webhooks/streaming-webhook-response-heartbeat");
class StreamingResponseWriter {
    constructor(stream) {
        this.stream = stream;
        this.deliveredError = false;
        this.stopped = false;
        this.heartbeat = new streaming_webhook_response_heartbeat_1.StreamingWebhookResponseHeartbeat(stream);
    }
    writeChunk(payload) {
        if (this.stopped)
            return;
        const chunk = payload;
        this.write(chunk);
        if (chunk.type === 'error')
            this.deliveredError = true;
    }
    finish(outcome) {
        if (this.stopped)
            return;
        if (outcome.status === 'undeliverable') {
            this.write(this.errorChunk(outcome.error.message));
        }
        if (outcome.status === 'timeout') {
            this.write(this.errorChunk('Workflow execution timed out'));
        }
        if (outcome.status === 'failed' && !this.deliveredError) {
            this.write(this.errorChunk('Workflow execution failed', outcome.nodeId, outcome.nodeName));
        }
        this.stop();
        if (!this.stream.writableEnded)
            this.stream.end();
    }
    stop() {
        if (this.stopped)
            return;
        this.stopped = true;
        this.heartbeat.stop();
    }
    write(chunk) {
        this.stream.write(`${JSON.stringify(chunk)}\n`);
        this.stream.flush?.();
    }
    errorChunk(content, nodeId = 'unknown', nodeName = 'unknown') {
        return {
            type: 'error',
            content,
            metadata: { nodeId, nodeName, runIndex: 0, itemIndex: 0, timestamp: Date.now() },
        };
    }
}
exports.StreamingResponseWriter = StreamingResponseWriter;
//# sourceMappingURL=streaming-response-writer.js.map