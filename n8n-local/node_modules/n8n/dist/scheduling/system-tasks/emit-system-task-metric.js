"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitSystemTaskMetric = emitSystemTaskMetric;
function emitSystemTaskMetric(eventService, event, payload) {
    try {
        eventService.emit(event, payload);
    }
    catch {
    }
}
//# sourceMappingURL=emit-system-task-metric.js.map