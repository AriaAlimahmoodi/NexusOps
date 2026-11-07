import { Logger } from '@n8n/backend-common';
import { EventService, WorkflowPublishedDataService } from '@n8n/backend-services';
import type { IWorkflowDb, PollerCursor, PollLeaseFence } from '@n8n/db';
import { ErrorReporter, StorageConfig, type IGetExecutePollFunctions, type IGetExecuteTriggerFunctions } from 'n8n-core';
import type { ExecutionError, INode, IPollFunctions, IWorkflowBase, IWorkflowExecuteAdditionalData, WorkflowActivateMode, WorkflowExecuteMode } from 'n8n-workflow';
import { Workflow } from 'n8n-workflow';
import { ActiveExecutions } from '../../active-executions';
import { ExecutionService } from '../../executions/execution.service';
import { NodeTypes } from '../../node-types';
import type { ScheduleTriggerCollectionSession } from '../../scheduling/schedule-trigger-node/schedule-trigger-job-registrar';
import { ScheduleTriggerJobRegistrar } from '../../scheduling/schedule-trigger-node/schedule-trigger-job-registrar';
import { OwnershipService } from '../../services/ownership.service';
import { EngineV2ActiveTriggers } from '../../workflows/triggers/engine-v2-active-triggers';
import { PollCursorService } from '../../workflows/triggers/poll-cursor.service';
import { WorkflowExecutionService } from '../../workflows/workflow-execution.service';
import { WorkflowPublisherService } from '../../workflows/workflow-publisher.service';
import { WorkflowStaticDataService } from '../../workflows/workflow-static-data.service';
export type TriggerFailureHandler = (opts: {
    error: Error;
    node: INode;
    workflowData: IWorkflowDb;
    mode: WorkflowExecuteMode;
    activation: WorkflowActivateMode;
}) => void;
export interface LeasedPoll {
    fence: PollLeaseFence;
    timeoutSeconds: number;
    remainingMs(): number;
}
export declare class TriggerExecutionContextFactory {
    private logger;
    private readonly errorReporter;
    private readonly activeExecutions;
    private readonly eventService;
    private readonly executionService;
    private readonly workflowStaticDataService;
    private readonly workflowExecutionService;
    private readonly storageConfig;
    private readonly workflowPublishedDataService;
    private readonly scheduleTriggerJobRegistrar;
    private readonly ownershipService;
    private readonly nodeTypes;
    private readonly pollCursorService;
    private readonly engineV2ActiveTriggers;
    private readonly workflowPublisherService;
    constructor(logger: Logger, errorReporter: ErrorReporter, activeExecutions: ActiveExecutions, eventService: EventService, executionService: ExecutionService, workflowStaticDataService: WorkflowStaticDataService, workflowExecutionService: WorkflowExecutionService, storageConfig: StorageConfig, workflowPublishedDataService: WorkflowPublishedDataService, scheduleTriggerJobRegistrar: ScheduleTriggerJobRegistrar, ownershipService: OwnershipService, nodeTypes: NodeTypes, pollCursorService: PollCursorService, engineV2ActiveTriggers: EngineV2ActiveTriggers, workflowPublisherService: WorkflowPublisherService);
    private settleDonePromise;
    private assertEngineV2Supported;
    private logTriggerExecutionFailure;
    private recordTriggerFailure;
    getExecuteTriggerFunctions(workflowData: IWorkflowDb, additionalData: IWorkflowExecuteAdditionalData, mode: WorkflowExecuteMode, activation: WorkflowActivateMode, resolveWorkflowData: () => Promise<IWorkflowBase>, onTriggerFailure: TriggerFailureHandler, scheduleCollectionSession: ScheduleTriggerCollectionSession): IGetExecuteTriggerFunctions;
    getExecutePollFunctions(workflowData: IWorkflowBase, additionalData: IWorkflowExecuteAdditionalData, mode: WorkflowExecuteMode, activation: WorkflowActivateMode, resolveWorkflowData: () => Promise<IWorkflowBase>, leasedPoll?: LeasedPoll, prefetchedCursor?: PollerCursor): IGetExecutePollFunctions;
    createPollExecutionContext(workflowData: IWorkflowBase, node: INode, leasedPoll?: LeasedPoll, prefetchedCursor?: PollerCursor): Promise<{
        workflow: Workflow;
        pollFunctions: IPollFunctions;
    }>;
    private attributeToPublisher;
    executeErrorWorkflow(error: ExecutionError, workflowData: IWorkflowBase, mode: WorkflowExecuteMode): void;
    findPublishedWorkflowData(workflowId: string, { bypassCache }?: {
        bypassCache?: boolean;
    }): Promise<IWorkflowBase | null>;
    loadPublishedWorkflowData(workflowId: string, options?: {
        bypassCache?: boolean;
    }): Promise<IWorkflowBase>;
}
