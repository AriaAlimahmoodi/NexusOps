import type { Logger } from '@n8n/backend-common';
import type { EventService } from '@n8n/backend-services';
import type { SystemTask } from '@n8n/decorators';
import type { ClaimedTask, DispatchDecision, DispatchReporter, TaskHandler, TaskRun } from '@n8n/scheduler';
import type { Tracing } from 'n8n-core';
export declare class SystemTaskHandler implements TaskHandler {
    private readonly systemTask;
    private readonly shutdownSignal;
    private readonly logger;
    private readonly eventService;
    private readonly tracing;
    private readonly onRunError;
    constructor(systemTask: SystemTask, shutdownSignal: AbortSignal, logger: Logger, eventService: EventService, tracing: Tracing, onRunError: (error: unknown) => void);
    execute(task: ClaimedTask, report: DispatchReporter, { signal: leaseSignal }: TaskRun): Promise<DispatchDecision>;
}
