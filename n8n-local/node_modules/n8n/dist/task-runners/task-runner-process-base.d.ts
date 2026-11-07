import { Logger, TypedEmitter } from '@n8n/backend-common';
import { LogScope, TaskRunnersConfig } from '@n8n/config';
import { spawn } from 'node:child_process';
import { TaskBrokerAuthService } from './task-broker/auth/task-broker-auth.service';
import { TaskRunnerLifecycleEvents } from './task-runner-lifecycle-events';
export type ChildProcess = ReturnType<typeof spawn>;
export declare const RUNNER_EXIT_GRACE_MS = 2000;
export declare function restartRetryDelay(attempt: number): number;
export type ExitReason = 'unknown' | 'oom';
export type TaskRunnerProcessEventMap = {
    exit: {
        reason: ExitReason;
    };
};
export declare abstract class TaskRunnerProcessBase extends TypedEmitter<TaskRunnerProcessEventMap> {
    protected readonly logger: Logger;
    protected readonly runnerConfig: TaskRunnersConfig;
    protected readonly authService: TaskBrokerAuthService;
    protected readonly runnerLifecycleEvents: TaskRunnerLifecycleEvents;
    protected readonly name: string;
    private runnerId;
    protected process: ChildProcess | null;
    protected _runPromise: Promise<void> | null;
    private startPromise;
    protected isShuttingDown: boolean;
    constructor(loggerScope: LogScope, logger: Logger, runnerConfig: TaskRunnersConfig, authService: TaskBrokerAuthService, runnerLifecycleEvents: TaskRunnerLifecycleEvents);
    private restartIfOwnRunner;
    get isRunning(): boolean;
    get pid(): number | undefined;
    get runPromise(): Promise<void> | null;
    get isInternal(): boolean;
    start(): Promise<void>;
    private spawnAndMonitor;
    stop(): Promise<void>;
    protected forceRestart(): Promise<void>;
    protected onProcessExit(code: number | null, resolveFn: () => void): void;
    private startWithRetries;
    protected monitorProcess(taskRunnerProcess: ChildProcess): void;
    abstract startProcess(grantToken: string, taskBrokerUri: string, runnerId: string): ChildProcess;
    setupProcessMonitoring?(process: ChildProcess): void;
    analyzeExitReason?(code: number | null): {
        reason: ExitReason;
    };
}
