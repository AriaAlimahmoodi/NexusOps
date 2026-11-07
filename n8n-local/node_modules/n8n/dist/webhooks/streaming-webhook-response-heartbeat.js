"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingWebhookResponseHeartbeat = void 0;
const STREAMING_HEARTBEAT_INTERVAL_MS = 30_000;
const STREAMING_KEEPALIVE_CHUNK = '{"type":"keepalive"}\n';
class StreamingWebhookResponseHeartbeat {
    constructor(stream) {
        this.stream = stream;
        this.stopped = false;
        this.stop = () => {
            if (this.stopped)
                return;
            this.stopped = true;
            clearInterval(this.timer);
            this.stream.off('finish', this.stop);
            this.stream.off('close', this.stop);
        };
        this.timer = setInterval(() => {
            if (this.stream.writableEnded || this.stream.destroyed) {
                this.stop();
                return;
            }
            this.stream.write(STREAMING_KEEPALIVE_CHUNK);
            this.stream.flush?.();
        }, STREAMING_HEARTBEAT_INTERVAL_MS);
        this.stream.once('finish', this.stop);
        this.stream.once('close', this.stop);
    }
}
exports.StreamingWebhookResponseHeartbeat = StreamingWebhookResponseHeartbeat;
//# sourceMappingURL=streaming-webhook-response-heartbeat.js.map