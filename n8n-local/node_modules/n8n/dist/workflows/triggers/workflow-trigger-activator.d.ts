import { EventService } from '@n8n/backend-services';
import { Logger } from '@n8n/backend-common';
import { WorkflowsConfig } from '@n8n/config';
import type { WorkflowEntity, WorkflowPublicationTriggerKind } from '@n8n/db';
import { WorkflowRepository } from '@n8n/db';
import { ErrorReporter, Tracing } from 'n8n-core';
import type { INode, WorkflowActivateMode, WorkflowId } from 'n8n-workflow';
import { ActivationErrorsService } from '../../activation-errors.service';
import { NodeTypes } from '../../node-types';
import type { WorkflowTriggerVersion } from '../../workflows/triggers/enabled-trigger-nodes';
import { NonWebhookTriggerRegistrar } from '../../workflows/triggers/non-webhook-trigger-registrar';
import { TriggerCountService } from '../../workflows/triggers/trigger-count.service';
import { TriggerExecutionContextFactory } from '../../workflows/triggers/trigger-execution-context.factory';
import { WebhookTriggerRegistrar } from '../../workflows/triggers/webhook-trigger-registrar';
import { WorkflowStaticDataService } from '../../workflows/workflow-static-data.service';
export type { WorkflowTriggerVersion };
export interface TriggerOperationAbort {
    signal: AbortSignal;
    onDetached: (work: Promise<unknown>) => void;
}
export type TriggerActivationFailure = {
    nodeId: INode['id'];
    nodeName: string;
    error: Error;
};
export type TriggerTeardownFailure = {
    nodeName: string;
    error: Error;
};
export type TriggerDeactivationOutcome = {
    externalTeardownFailures: TriggerTeardownFailure[];
};
export type TriggerActivationOutcome = {
    activated: Array<INode['id']>;
    failures: TriggerActivationFailure[];
};
export declare class WorkflowTriggerActivator {
    private readonly logger;
    private readonly errorReporter;
    private readonly nodeTypes;
    private readonly workflowRepository;
    private readonly workflowStaticDataService;
    private readonly workflowsConfig;
    private readonly triggerExecutionContextFactory;
    private readonly webhookTriggerRegistrar;
    private readonly nonWebhookTriggerRegistrar;
    private readonly triggerCountService;
    private readonly activationErrorsService;
    private readonly tracing;
    private readonly eventService;
    constructor(logger: Logger, errorReporter: ErrorReporter, nodeTypes: NodeTypes, workflowRepository: WorkflowRepository, workflowStaticDataService: WorkflowStaticDataService, workflowsConfig: WorkflowsConfig, triggerExecutionContextFactory: TriggerExecutionContextFactory, webhookTriggerRegistrar: WebhookTriggerRegistrar, nonWebhookTriggerRegistrar: NonWebhookTriggerRegistrar, triggerCountService: TriggerCountService, activationErrorsService: ActivationErrorsService, tracing: Tracing, eventService: EventService);
    getEnabledTriggerNodes(version: WorkflowTriggerVersion | null): INode[];
    getTriggerKinds(nodes: INode[]): Map<INode['id'], WorkflowPublicationTriggerKind>;
    getUnregisteredNonWebhookTriggerNodeIds(workflowId: WorkflowId, desiredNodes: INode[]): Set<INode['id']>;
    getNodesWithUnregisteredWebhooks(dbWorkflow: WorkflowEntity, version: WorkflowTriggerVersion): Promise<Set<INode['id']>>;
    private getNonWebhookTriggerNodeIds;
    activate(dbWorkflow: WorkflowEntity, version: WorkflowTriggerVersion, nodeIds: Set<INode['id']>, activationMode: WorkflowActivateMode, abort: TriggerOperationAbort): Promise<TriggerActivationOutcome>;
    private activateInternal;
    deactivate(dbWorkflow: WorkflowEntity, version: WorkflowTriggerVersion, nodeIds: Set<INode['id']>, abort: TriggerOperationAbort): Promise<TriggerDeactivationOutcome>;
    deregisterUnresolvableNodes(workflowId: WorkflowId, nodes: INode[], abort: TriggerOperationAbort): Promise<void>;
    private deactivateInternal;
    updateTriggerCount(dbWorkflow: WorkflowEntity, version: WorkflowTriggerVersion): Promise<void>;
    private emitTriggerOperation;
    private emitTriggerNodeOperations;
    private applyVersionToDbWorkflow;
    private createWorkflow;
    private registerWebhookTriggers;
    private registerWebhookTriggersForNode;
    private groupWebhookTriggersByNode;
    private deregisterWebhookTriggers;
    private getNodeWebhooks;
    private deregisterExternalWebhookWithRetry;
    private getWebhookTriggersForNodeIds;
    private registerNonWebhookTriggers;
    private resolveNodeName;
    private deregisterNonWebhookTriggers;
    private shouldAbandonFailedTeardown;
    private getNonWebhookTriggerNodeIdsForNodeIds;
    private createWorkflowDataResolver;
    private throwRejectedPhaseError;
    private recoverFromRuntimeTriggerFailure;
}
