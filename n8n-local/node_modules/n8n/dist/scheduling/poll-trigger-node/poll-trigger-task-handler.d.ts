import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { WorkflowRepository } from '@n8n/db';
import type { ClaimedTask, DispatchDecision, DispatchReporter, TaskHandler, TaskRun } from '@n8n/scheduler';
import { ErrorReporter, TriggersAndPollers } from 'n8n-core';
import { PollBackoffService } from '../../workflows/triggers/poll-backoff.service';
import { TriggerExecutionContextFactory } from '../../workflows/triggers/trigger-execution-context.factory';
export declare class PollTriggerTaskHandler implements TaskHandler {
    private logger;
    private readonly triggerExecutionContextFactory;
    private readonly triggersAndPollers;
    private readonly workflowRepository;
    private readonly errorReporter;
    private readonly pollBackoffService;
    private readonly eventService;
    readonly taskType = "workflow:poll-trigger";
    constructor(logger: Logger, triggerExecutionContextFactory: TriggerExecutionContextFactory, triggersAndPollers: TriggersAndPollers, workflowRepository: WorkflowRepository, errorReporter: ErrorReporter, pollBackoffService: PollBackoffService, eventService: EventService);
    execute(task: ClaimedTask, report: DispatchReporter, { signal: leaseSignal, remainingMs }: TaskRun): Promise<DispatchDecision>;
    private recordPollTimeout;
    private recordFailureIfActive;
    private hasHealthyNodeIds;
    private parsePayload;
}
