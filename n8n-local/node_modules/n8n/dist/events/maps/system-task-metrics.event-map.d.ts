export type SystemTaskMode = 'leader_timer' | 'instance_timer' | 'durable';
export type SystemTaskRunResult = 'success' | 'failure' | 'aborted' | 'lease_lost' | 'timed_out';
export declare const SYSTEM_TASK_SKIP_REASONS: readonly ['overlap', 'provisioned_elsewhere', 'aborted', 'coalesced'];
export type SystemTaskSkipReason = (typeof SYSTEM_TASK_SKIP_REASONS)[number];
export type SystemTaskMetricsEventMap = {
    'system-task-routed': {
        name: string;
        mode: SystemTaskMode;
        intervalSeconds?: number;
    };
    'system-task-timers-started': {};
    'system-task-timers-stopped': {};
    'system-task-run-started': {
        name: string;
        mode: SystemTaskMode;
    };
    'system-task-run-settled': {
        name: string;
        mode: SystemTaskMode;
        result: SystemTaskRunResult;
        durationMs: number;
    };
    'system-task-run-skipped': {
        name: string;
        reason: SystemTaskSkipReason;
        count?: number;
    };
    'system-task-scheduling-failed': {
        name: string;
        mode: SystemTaskMode;
    };
    'system-task-provision-check-failed': {
        name: string;
    };
    'system-task-retry-scheduled': {
        name: string;
    };
    'system-task-next-run-planned': {
        name: string;
        nextRunAtMs: number;
    };
    'system-task-fired': {
        name: string;
        lagMs: number;
    };
};
