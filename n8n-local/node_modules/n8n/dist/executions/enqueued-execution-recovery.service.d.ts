import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { ExecutionsConfig } from '@n8n/config';
import { ErrorReporter } from 'n8n-core';
import { ExecutionCrashService } from '../executions/execution-crash.service';
import { ExecutionService } from '../executions/execution.service';
import { OwnershipService } from '../services/ownership.service';
import { WorkflowPublisherService } from '../workflows/workflow-publisher.service';
import { WorkflowRunner } from '../workflow-runner';
export declare class EnqueuedExecutionRecoveryService {
    private readonly logger;
    private readonly errorReporter;
    private readonly executionsConfig;
    private readonly executionService;
    private readonly executionCrashService;
    private readonly ownershipService;
    private readonly workflowPublisherService;
    private readonly workflowRunner;
    private readonly eventService;
    constructor(logger: Logger, errorReporter: ErrorReporter, executionsConfig: ExecutionsConfig, executionService: ExecutionService, executionCrashService: ExecutionCrashService, ownershipService: OwnershipService, workflowPublisherService: WorkflowPublisherService, workflowRunner: WorkflowRunner, eventService: EventService);
    recoverEnqueuedExecutions(): Promise<void>;
    private crashUnstartableExecution;
}
