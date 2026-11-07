"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchedulerTracer = createSchedulerTracer;
function createSchedulerTracer(tracing) {
    return {
        startSpan: async ({ newTrace, ...options }, run) => await (newTrace === true
            ? tracing.startNewTraceSpan(options, run)
            : tracing.startSpan(options, run)),
    };
}
//# sourceMappingURL=scheduler-tracer.js.map