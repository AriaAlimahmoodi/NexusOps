import type { Logger } from '@n8n/backend-common';
import type { EventService } from '@n8n/backend-services';
import type { SystemTask, SystemTaskSchedule } from '@n8n/decorators';
import type { Tracing } from 'n8n-core';
import type { SystemTaskMode } from '../../events/maps/system-task-metrics.event-map';
export type InMemorySystemTaskMode = Exclude<SystemTaskMode, 'durable'>;
export type InMemorySystemTaskHooks = {
    reportFailure: (message: string, taskName: Pick<SystemTask, 'name'>, error: unknown) => void;
    onStart?: () => void;
    onStop?: () => void;
};
export type InMemorySystemTaskOptions = {
    runOnStart?: boolean;
    retryDelaySeconds?: number;
    shouldSkipRun?: () => Promise<boolean>;
};
export declare class InMemorySystemTaskRunner {
    private readonly mode;
    private readonly logger;
    private readonly eventService;
    private readonly tracing;
    private readonly timezone;
    private readonly hooks;
    private readonly entries;
    private started;
    private generation;
    private controller;
    constructor(mode: InMemorySystemTaskMode, logger: Logger, eventService: EventService, tracing: Tracing, timezone: string, hooks: InMemorySystemTaskHooks);
    add(task: SystemTask, schedule: SystemTaskSchedule, options?: InMemorySystemTaskOptions): void;
    start(from: Date): void;
    stop(): Promise<void>;
    private startTimer;
    private stopTimer;
    private createTimer;
    private run;
    private runOnce;
    private scheduleRetry;
    private cancelRetry;
    private emitSkipped;
}
