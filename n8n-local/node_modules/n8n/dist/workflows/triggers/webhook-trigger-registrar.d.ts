import { Logger } from '@n8n/backend-common';
import type { INode, IWebhookData, IWorkflowExecuteAdditionalData, WorkflowActivateMode, WorkflowExecuteMode } from 'n8n-workflow';
import { Workflow } from 'n8n-workflow';
import { ErrorReporter, Tracing } from 'n8n-core';
import { WebhookService } from '../../webhooks/webhook.service';
import { WorkflowStaticDataService } from '../../workflows/workflow-static-data.service';
export interface WebhookTriggerRegistrationOptions {
    workflow: Workflow;
    webhookData: IWebhookData;
    mode: WorkflowExecuteMode;
    activation: WorkflowActivateMode;
}
export interface WebhookTriggerDeregistrationOptions {
    workflow: Workflow;
    webhookData: IWebhookData;
}
export declare class WebhookTriggerRegistrar {
    private readonly logger;
    private readonly errorReporter;
    private readonly webhookService;
    private readonly workflowStaticDataService;
    private readonly tracing;
    constructor(logger: Logger, errorReporter: ErrorReporter, webhookService: WebhookService, workflowStaticDataService: WorkflowStaticDataService, tracing: Tracing);
    getWebhookTriggers(workflow: Workflow, additionalData: IWorkflowExecuteAdditionalData): IWebhookData[];
    getNodeWebhookTriggers(workflow: Workflow, node: INode, additionalData: IWorkflowExecuteAdditionalData): IWebhookData[];
    register({ workflow, webhookData, mode, activation }: WebhookTriggerRegistrationOptions): Promise<void>;
    deregister({ workflow, webhookData }: WebhookTriggerDeregistrationOptions): Promise<string>;
    clearWorkflowWebhooksForNodes(workflowId: string, nodeNames: string[]): Promise<void>;
    getNodesWithUnregisteredWebhooks(workflow: Workflow, additionalData: IWorkflowExecuteAdditionalData, desiredNodes: Set<INode['id']>): Promise<Set<INode['id']>>;
    private buildNormalizedWebhook;
    private buildWebhookKey;
    private clearRegisteredWebhook;
}
