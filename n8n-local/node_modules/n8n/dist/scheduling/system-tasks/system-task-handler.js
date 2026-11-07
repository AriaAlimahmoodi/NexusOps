"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemTaskHandler = void 0;
const system_task_run_observer_1 = require("./system-task-run-observer");
class SystemTaskHandler {
    constructor(systemTask, shutdownSignal, logger, eventService, tracing, onRunError) {
        this.systemTask = systemTask;
        this.shutdownSignal = shutdownSignal;
        this.logger = logger;
        this.eventService = eventService;
        this.tracing = tracing;
        this.onRunError = onRunError;
    }
    async execute(task, report, { signal: leaseSignal }) {
        const outcome = await (0, system_task_run_observer_1.observeSystemTaskRun)(this.eventService, this.tracing, this.systemTask, 'durable', this.shutdownSignal, leaseSignal);
        if (outcome.rejected) {
            if (outcome.result === 'failure') {
                this.onRunError(outcome.error);
            }
            throw outcome.error;
        }
        leaseSignal.throwIfAborted();
        this.logger.debug('Ran a system task occurrence', {
            name: this.systemTask.name,
            taskId: task.id,
            jobId: task.jobId,
        });
        return report.dispatched();
    }
}
exports.SystemTaskHandler = SystemTaskHandler;
//# sourceMappingURL=system-task-handler.js.map