import { Logger } from '@n8n/backend-common';
import type { WorkflowEntity } from '@n8n/db';
import { ActiveWorkflowTriggers, Tracing, type IGetExecutePollFunctions, type IGetExecuteTriggerFunctions } from 'n8n-core';
import type { INode, IWorkflowBase, IWorkflowExecuteAdditionalData, Workflow, WorkflowActivateMode, WorkflowExecuteMode, WorkflowId } from 'n8n-workflow';
import type { ScheduleTriggerCollectionSession } from '../../scheduling/schedule-trigger-node/schedule-trigger-job-registrar';
import { PollTriggerJobRegistrar } from '../../scheduling/poll-trigger-node/poll-trigger-job-registrar';
import { ScheduleTriggerJobRegistrar } from '../../scheduling/schedule-trigger-node/schedule-trigger-job-registrar';
import type { TriggerFailureHandler } from '../../workflows/triggers/trigger-execution-context.factory';
import { TriggerExecutionContextFactory } from '../../workflows/triggers/trigger-execution-context.factory';
export interface NonWebhookTriggerRegistrationContext {
    activationMode: WorkflowActivateMode;
    executionMode: WorkflowExecuteMode;
    additionalData: IWorkflowExecuteAdditionalData;
    resolveWorkflowData: () => Promise<IWorkflowBase>;
    onTriggerFailure: TriggerFailureHandler;
}
export interface PreparedNonWebhookTriggerRegistration {
    activationMode: WorkflowActivateMode;
    executionMode: WorkflowExecuteMode;
    additionalData: IWorkflowExecuteAdditionalData;
    getTriggerFunctions: IGetExecuteTriggerFunctions;
    getPollFunctions: IGetExecutePollFunctions;
    scheduleCollectionSession: ScheduleTriggerCollectionSession;
}
export declare class NonWebhookTriggerRegistrar {
    private readonly logger;
    private readonly activeWorkflowTriggers;
    private readonly triggerExecutionContextFactory;
    private readonly scheduleTriggerJobRegistrar;
    private readonly pollTriggerJobRegistrar;
    private readonly tracing;
    constructor(logger: Logger, activeWorkflowTriggers: ActiveWorkflowTriggers, triggerExecutionContextFactory: TriggerExecutionContextFactory, scheduleTriggerJobRegistrar: ScheduleTriggerJobRegistrar, pollTriggerJobRegistrar: PollTriggerJobRegistrar, tracing: Tracing);
    getTriggerNodeIds(workflow: Workflow): string[];
    getRegisteredTriggerNodeIds(workflowId: WorkflowId): Set<string>;
    createRegistrationContext(dbWorkflow: WorkflowEntity, { activationMode, executionMode, additionalData, resolveWorkflowData, onTriggerFailure, }: NonWebhookTriggerRegistrationContext): {
        activationMode: WorkflowActivateMode;
        executionMode: "agent" | "chat" | "cli" | "error" | "evaluation" | "integrated" | "internal" | "manual" | "retry" | "trigger" | "webhook";
        additionalData: IWorkflowExecuteAdditionalData;
        getTriggerFunctions: IGetExecuteTriggerFunctions;
        getPollFunctions: IGetExecutePollFunctions;
        scheduleCollectionSession: ScheduleTriggerCollectionSession;
    };
    register(workflow: Workflow, { activationMode, executionMode, additionalData, getTriggerFunctions, getPollFunctions, scheduleCollectionSession, }: PreparedNonWebhookTriggerRegistration, nodeId: INode['id']): Promise<void>;
    deregister(workflowId: WorkflowId, nodeId: INode['id'], onDetached?: (work: Promise<unknown>) => void): Promise<void>;
    private removeDurableJobs;
}
