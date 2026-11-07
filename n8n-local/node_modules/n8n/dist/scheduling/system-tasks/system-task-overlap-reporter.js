"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSystemTaskOverlaps = reportSystemTaskOverlaps;
const emit_system_task_metric_1 = require("./emit-system-task-metric");
const system_task_type_1 = require("./system-task-type");
function reportSystemTaskOverlaps(eventService, occurrences) {
    occurrences
        .map(({ taskType }) => (0, system_task_type_1.systemTaskName)(taskType))
        .filter((name) => name !== undefined)
        .reduce((counts, name) => counts.set(name, (counts.get(name) ?? 0) + 1), new Map())
        .forEach((count, name) => (0, emit_system_task_metric_1.emitSystemTaskMetric)(eventService, 'system-task-run-skipped', {
        name,
        reason: 'overlap',
        count,
    }));
}
//# sourceMappingURL=system-task-overlap-reporter.js.map