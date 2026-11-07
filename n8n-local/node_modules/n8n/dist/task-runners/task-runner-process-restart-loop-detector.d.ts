import { TypedEmitter } from '@n8n/backend-common';
import { TaskRunnerRestartLoopError } from '../task-runners/errors/task-runner-restart-loop-error';
import type { TaskRunnerProcessBase } from './task-runner-process-base';
type TaskRunnerProcessRestartLoopDetectorEventMap = {
    'restart-loop-detected': TaskRunnerRestartLoopError;
};
export declare class TaskRunnerProcessRestartLoopDetector extends TypedEmitter<TaskRunnerProcessRestartLoopDetectorEventMap> {
    private readonly taskRunnerProcess;
    private readonly maxCount;
    private readonly restartsWindow;
    private numRestarts;
    private firstRestartedAt;
    constructor(taskRunnerProcess: TaskRunnerProcessBase);
    private increment;
    private reset;
    private isMaxCountExceeded;
    private msSinceFirstIncrement;
}
export {};
