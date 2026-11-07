import { Logger } from '@n8n/backend-common';
import { TaskRunnersConfig } from '@n8n/config';
import { TaskBrokerAuthService } from './task-broker/auth/task-broker-auth.service';
import { TaskRunnerLifecycleEvents } from './task-runner-lifecycle-events';
import { TaskRunnerProcessBase } from './task-runner-process-base';
export declare class PyTaskRunnerProcess extends TaskRunnerProcessBase {
    protected readonly name = "runner:py";
    constructor(logger: Logger, runnerConfig: TaskRunnersConfig, authService: TaskBrokerAuthService, runnerLifecycleEvents: TaskRunnerLifecycleEvents);
    startProcess(grantToken: string, taskBrokerUri: string, runnerId: string): import("child_process").ChildProcessWithoutNullStreams;
    static checkRequirements(): Promise<'python' | 'venv' | null>;
    static getVenvPath(): string;
}
