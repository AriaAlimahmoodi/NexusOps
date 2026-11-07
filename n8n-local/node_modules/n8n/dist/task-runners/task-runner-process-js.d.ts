import { Logger } from '@n8n/backend-common';
import { TaskRunnersConfig } from '@n8n/config';
import { TaskBrokerAuthService } from './task-broker/auth/task-broker-auth.service';
import { TaskRunnerLifecycleEvents } from './task-runner-lifecycle-events';
import { ChildProcess, ExitReason, TaskRunnerProcessBase } from './task-runner-process-base';
export declare class JsTaskRunnerProcess extends TaskRunnerProcessBase {
    protected readonly name = "runner:js";
    private oomDetector;
    constructor(logger: Logger, runnerConfig: TaskRunnersConfig, authService: TaskBrokerAuthService, runnerLifecycleEvents: TaskRunnerLifecycleEvents);
    startProcess(grantToken: string, taskBrokerUri: string, runnerId: string): ChildProcess;
    setupProcessMonitoring(process: ChildProcess): void;
    analyzeExitReason(): {
        reason: ExitReason;
    };
    private getProcessEnvVars;
}
