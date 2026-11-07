import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import { ExecutionRepository } from '@n8n/db';
import type { ClaimedTask, DispatchDecision, DispatchReporter, TaskHandler } from '@n8n/scheduler';
import { ErrorReporter } from 'n8n-core';
import { OwnershipService } from '../../services/ownership.service';
import { TriggerExecutionContextFactory } from '../../workflows/triggers/trigger-execution-context.factory';
import { WorkflowExecutionService } from '../../workflows/workflow-execution.service';
import { WorkflowPublisherService } from '../../workflows/workflow-publisher.service';
export declare class ScheduleTriggerTaskHandler implements TaskHandler {
    private logger;
    private readonly errorReporter;
    private readonly globalConfig;
    private readonly executionRepository;
    private readonly eventService;
    private readonly triggerExecutionContextFactory;
    private readonly workflowExecutionService;
    private readonly ownershipService;
    private readonly workflowPublisherService;
    readonly taskType = "workflow:schedule-trigger";
    constructor(logger: Logger, errorReporter: ErrorReporter, globalConfig: GlobalConfig, executionRepository: ExecutionRepository, eventService: EventService, triggerExecutionContextFactory: TriggerExecutionContextFactory, workflowExecutionService: WorkflowExecutionService, ownershipService: OwnershipService, workflowPublisherService: WorkflowPublisherService);
    execute(task: ClaimedTask, report: DispatchReporter): Promise<DispatchDecision>;
    private parsePayload;
    private recordExistingHandoff;
}
