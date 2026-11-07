import { Logger } from '@n8n/backend-common';
import { GlobalConfig, WorkflowsConfig } from '@n8n/config';
import type { EntityManager } from '@n8n/db';
import type { INode, SchedulingFunctions, Workflow } from 'n8n-workflow';
import { DurableJobProvisioner } from '../durable-job-provisioner';
import { WorkflowScheduledJobOwner } from '../workflow-scheduled-job-owner';
export interface ScheduleTriggerCollectionSession {
    createCollector(workflow: Workflow, node: INode): SchedulingFunctions;
    commit(workflowId: string, nodeId: string): Promise<void>;
    discard(workflowId: string, nodeId: string): void;
}
export declare class ScheduleTriggerJobRegistrar {
    private readonly logger;
    private readonly jobProvisioner;
    private readonly owner;
    private readonly intercepting;
    private readonly defaultTimezone;
    private readonly triggerNodeMode;
    constructor(logger: Logger, globalConfig: GlobalConfig, workflowsConfig: WorkflowsConfig, jobProvisioner: DurableJobProvisioner, owner: WorkflowScheduledJobOwner);
    interceptsNode(node: INode): boolean;
    createSession(): ScheduleTriggerCollectionSession;
    private toSchedule;
    private provisionCollected;
    remove(workflowId: string, nodeId: string): Promise<void>;
    removeWorkflow(workflowId: string): Promise<void>;
    removeWorkflowInTransaction(manager: EntityManager, workflowId: string): Promise<void>;
}
