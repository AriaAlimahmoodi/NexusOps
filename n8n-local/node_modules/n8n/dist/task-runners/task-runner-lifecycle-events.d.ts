import { TypedEmitter } from '@n8n/backend-common';
type RunnerIdentity = {
    runnerId: string;
};
export type TaskRunnerLifecycleEventMap = {
    'runner:failed-heartbeat-check': RunnerIdentity;
    'runner:timed-out-during-task': RunnerIdentity;
    'runner:unresponsive': RunnerIdentity;
};
export declare class TaskRunnerLifecycleEvents extends TypedEmitter<TaskRunnerLifecycleEventMap> {
}
export {};
