"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemTaskType = systemTaskType;
exports.systemTaskName = systemTaskName;
const SYSTEM_TASK_TYPE_PREFIX = 'system:';
function systemTaskType(taskName) {
    return `${SYSTEM_TASK_TYPE_PREFIX}${taskName}`;
}
function systemTaskName(taskType) {
    return taskType.startsWith(SYSTEM_TASK_TYPE_PREFIX)
        ? taskType.slice(SYSTEM_TASK_TYPE_PREFIX.length)
        : undefined;
}
//# sourceMappingURL=system-task-type.js.map