"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerProcessRestartLoopDetector = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const task_runner_restart_loop_error_1 = require("../task-runners/errors/task-runner-restart-loop-error");
const MAX_RESTARTS = 5;
const RESTARTS_WINDOW = 2 * constants_1.Time.seconds.toMilliseconds;
class TaskRunnerProcessRestartLoopDetector extends backend_common_1.TypedEmitter {
    constructor(taskRunnerProcess) {
        super();
        this.taskRunnerProcess = taskRunnerProcess;
        this.maxCount = MAX_RESTARTS;
        this.restartsWindow = RESTARTS_WINDOW;
        this.numRestarts = 0;
        this.firstRestartedAt = Date.now();
        this.taskRunnerProcess.on('exit', () => {
            this.increment();
            if (this.isMaxCountExceeded()) {
                this.emit('restart-loop-detected', new task_runner_restart_loop_error_1.TaskRunnerRestartLoopError(this.numRestarts, this.msSinceFirstIncrement()));
            }
        });
    }
    increment() {
        const now = Date.now();
        if (now > this.firstRestartedAt + this.restartsWindow) {
            this.reset();
        }
        this.numRestarts++;
    }
    reset() {
        this.numRestarts = 0;
        this.firstRestartedAt = Date.now();
    }
    isMaxCountExceeded() {
        return this.numRestarts >= this.maxCount;
    }
    msSinceFirstIncrement() {
        return Date.now() - this.firstRestartedAt;
    }
}
exports.TaskRunnerProcessRestartLoopDetector = TaskRunnerProcessRestartLoopDetector;
//# sourceMappingURL=task-runner-process-restart-loop-detector.js.map