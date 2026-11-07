"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlidingWindow = void 0;
class SlidingWindow {
    constructor(options) {
        this.eventTimestamps = [];
        this.maxEvents = options.maxEvents;
        this.durationMs = options.durationMs;
    }
    addEvent(timestamp) {
        this.eventTimestamps.push(timestamp);
        if (this.eventTimestamps.length > this.maxEvents * 2) {
            this.eventTimestamps = this.eventTimestamps.slice(-this.maxEvents * 2);
        }
    }
    getCount() {
        const now = Date.now();
        const windowStart = now - this.durationMs;
        this.eventTimestamps = this.eventTimestamps.filter((timestamp) => timestamp >= windowStart);
        return this.eventTimestamps.length;
    }
    clear() {
        this.eventTimestamps = [];
    }
}
exports.SlidingWindow = SlidingWindow;
//# sourceMappingURL=sliding-window.js.map