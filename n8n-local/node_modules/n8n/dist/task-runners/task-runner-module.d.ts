import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { TaskRunnersConfig } from '@n8n/config';
import { ErrorReporter } from 'n8n-core';
export declare class TaskRunnerModule {
    private readonly logger;
    private readonly errorReporter;
    private readonly runnerConfig;
    private readonly eventService;
    private taskBrokerHttpServer;
    private taskBrokerWsServer;
    private taskRequester;
    private jsRunnerProcess;
    private pyRunnerProcess;
    private jsRunnerProcessRestartLoopDetector;
    private pyRunnerProcessRestartLoopDetector;
    constructor(logger: Logger, errorReporter: ErrorReporter, runnerConfig: TaskRunnersConfig, eventService: EventService);
    start(): Promise<void>;
    stop(): Promise<void>;
    private loadTaskRequester;
    private loadTaskBroker;
    private startInternalTaskRunners;
    private onRunnerRestartLoopDetected;
}
