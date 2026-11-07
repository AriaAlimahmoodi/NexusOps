"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceSystemTasks = instanceSystemTasks;
async function instanceSystemTasks(globalConfig) {
    const tasks = [];
    if (globalConfig.diagnostics.enabled) {
        const { TelemetryBufferFlushTask } = await import('../../telemetry/telemetry-buffer-flush.task.js');
        tasks.push(TelemetryBufferFlushTask);
    }
    if (globalConfig.eventBus.checkUnsentInterval > 0) {
        const { EventBusUnsentMessageFlushTask } = await import('../../eventbus/message-event-bus/event-bus-unsent-message-flush.task.js');
        tasks.push(EventBusUnsentMessageFlushTask);
    }
    return tasks;
}
//# sourceMappingURL=instance-system-tasks.js.map