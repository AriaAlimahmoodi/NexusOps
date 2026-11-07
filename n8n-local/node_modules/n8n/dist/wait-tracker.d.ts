import { Logger } from '@n8n/backend-common';
import { ExecutionRepository } from '@n8n/db';
import { InstanceSettings } from 'n8n-core';
import { type IRun, type IWorkflowBase, type RelatedExecution } from 'n8n-workflow';
import { ActiveExecutions } from './active-executions';
import { ExecutionPersistence } from './executions/execution-persistence';
import { OwnershipService } from './services/ownership.service';
import { WorkflowPublisherService } from './workflows/workflow-publisher.service';
import { WorkflowRunner } from './workflow-runner';
export declare class WaitTracker {
    private readonly logger;
    private readonly executionRepository;
    private readonly executionPersistence;
    private readonly ownershipService;
    private readonly workflowPublisherService;
    private readonly activeExecutions;
    private readonly workflowRunner;
    private readonly instanceSettings;
    private waitingExecutions;
    mainTimer: NodeJS.Timeout;
    private resumingParkedParents;
    constructor(logger: Logger, executionRepository: ExecutionRepository, executionPersistence: ExecutionPersistence, ownershipService: OwnershipService, workflowPublisherService: WorkflowPublisherService, activeExecutions: ActiveExecutions, workflowRunner: WorkflowRunner, instanceSettings: InstanceSettings);
    has(executionId: string): boolean;
    getDiagnosticCounts(): {
        waitingExecutions: number;
    };
    init(): void;
    private startTracking;
    getWaitingExecutions(): Promise<void>;
    stopExecution(executionId: string): void;
    startExecution(executionId: string): Promise<void>;
    resumeParentExecution(parentExecution: RelatedExecution, executePromise: Promise<IRun | undefined>, childExecution?: RelatedExecution, childWorkflowData?: IWorkflowBase): Promise<void>;
    private patchParent;
    private claimParent;
    resumeParentsOfFinishedSubExecutions(): Promise<void>;
    private resumeParentIfChildFinished;
    private withRetry;
    stopTracking(): void;
}
