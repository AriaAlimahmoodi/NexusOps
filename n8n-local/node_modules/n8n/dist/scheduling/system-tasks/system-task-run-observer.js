"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observeSystemTaskRun = observeSystemTaskRun;
const scheduler_1 = require("@n8n/scheduler");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const emit_system_task_metric_1 = require("./emit-system-task-metric");
const SYSTEM_TASK_ATTRIBUTES = {
    name: 'n8n.system_task.name',
    mode: 'n8n.system_task.mode',
    result: 'n8n.system_task.result',
};
async function startRun(task, signal) {
    await task.run(signal);
}
async function observeSystemTaskRun(eventService, tracing, task, mode, signal, leaseSignal) {
    const { name } = task;
    const runSignal = leaseSignal ? AbortSignal.any([signal, leaseSignal]) : signal;
    const abortResult = () => {
        if (leaseSignal?.aborted) {
            return leaseSignal.reason instanceof scheduler_1.TaskTimeoutError ? 'timed_out' : 'lease_lost';
        }
        return signal.aborted ? 'aborted' : undefined;
    };
    const spanOptions = {
        name: 'System task run',
        op: 'system_task.run',
        attributes: {
            [SYSTEM_TASK_ATTRIBUTES.name]: name,
            [SYSTEM_TASK_ATTRIBUTES.mode]: mode,
        },
    };
    const startSpan = mode === 'durable' ? tracing.startSpan.bind(tracing) : tracing.startNewTraceSpan.bind(tracing);
    return await startSpan(spanOptions, async (span) => {
        const startedAt = performance.now();
        (0, emit_system_task_metric_1.emitSystemTaskMetric)(eventService, 'system-task-run-started', { name, mode });
        const outcome = await startRun(task, runSignal).then(() => ({
            result: abortResult() ?? 'success',
            rejected: false,
        }), (error) => ({
            result: abortResult() ?? 'failure',
            rejected: true,
            error,
        }));
        (0, emit_system_task_metric_1.emitSystemTaskMetric)(eventService, 'system-task-run-settled', {
            name,
            mode,
            result: outcome.result,
            durationMs: performance.now() - startedAt,
        });
        span.setAttribute(SYSTEM_TASK_ATTRIBUTES.result, outcome.result);
        if (outcome.result === 'failure') {
            span.setStatus({ code: 2, message: (0, ensure_error_1.ensureError)(outcome.error).message });
        }
        else {
            span.setStatus({ code: 1 });
        }
        return outcome;
    });
}
//# sourceMappingURL=system-task-run-observer.js.map