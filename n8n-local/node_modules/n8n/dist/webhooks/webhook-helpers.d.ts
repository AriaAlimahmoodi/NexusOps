import { type IDeferredPromise } from '@n8n/utils/promise/deferred-promise';
import type express from 'express';
import type { IN8nHttpFullResponse, INode, IPinData, IRunExecutionData, IWebhookData, IWebhookResponseData, IWorkflowExecuteAdditionalData, WebhookResponseMode, Workflow, WorkflowExecuteMode, IWorkflowBase, IDestinationNode, ExecutionStorageLocation } from 'n8n-workflow';
import { WebhookResponder, type WebhookResponseCallback } from './webhook-responder';
import type { IWebhookResponseCallbackData, WebhookRequest } from './webhook.types';
interface WebhookInvocationResult {
    webhookResultData: IWebhookResponseData;
    runExecutionDataChanges: WebhookExecutionDataChanges;
    failed: boolean;
}
interface WebhookExecutionDataChanges {
    resultData?: {
        runData: Record<string, never>;
        lastNodeExecuted: string;
        error: Record<string, unknown>;
    };
}
export declare function handleHostedChatResponse(res: express.Response, responseMode: WebhookResponseMode, executionId: string, responder: WebhookResponder, resumeToken?: string): void;
export declare function getWorkflowWebhooks(workflow: Workflow, additionalData: IWorkflowExecuteAdditionalData, destinationNode?: IDestinationNode, ignoreRestartWebhooks?: boolean): IWebhookData[];
export declare function autoDetectResponseMode(workflowStartNode: INode, workflow: Workflow, method: string): WebhookResponseMode | undefined;
export declare const handleFormRedirectionCase: <T extends IWebhookResponseCallbackData>(data: T, workflowStartNode: INode) => T;
export declare function setupResponseNodePromise(responsePromise: IDeferredPromise<IN8nHttpFullResponse>, res: express.Response, responder: WebhookResponder, workflowStartNode: INode, executionId: string | undefined, workflow: Workflow): void;
export declare function invokeWebhook({ workflow, webhookData, workflowStartNode, additionalData, executionMode, runExecutionData, webhookType, responder, }: {
    workflow: Workflow;
    webhookData: IWebhookData;
    workflowStartNode: INode;
    additionalData: IWorkflowExecuteAdditionalData;
    executionMode: WorkflowExecuteMode;
    runExecutionData: IRunExecutionData | undefined;
    webhookType: 'Form' | 'Webhook';
    responder: WebhookResponder;
}): Promise<WebhookInvocationResult>;
export declare function checkTriggerCredentialGate({ workflowStartNode, additionalData, res, responder, }: {
    workflowStartNode: INode;
    additionalData: IWorkflowExecuteAdditionalData;
    res: express.Response;
    responder: WebhookResponder;
}): Promise<boolean>;
export declare function handleImmediateWebhookResponse({ webhookResultData, responseCode, responder, }: {
    webhookResultData: IWebhookResponseData;
    responseCode: number;
    responder: WebhookResponder;
}): boolean;
export declare function prepareExecutionData(executionMode: WorkflowExecuteMode, workflowStartNode: INode, webhookResultData: IWebhookResponseData, runExecutionData: IRunExecutionData | undefined, runExecutionDataMerge?: object, destinationNode?: IDestinationNode, executionId?: string, workflowData?: IWorkflowBase, userId?: string): {
    runExecutionData: IRunExecutionData;
    pinData: IPinData | undefined;
};
export declare function executeWebhook(workflow: Workflow, webhookData: IWebhookData, workflowData: IWorkflowBase, workflowStartNode: INode, executionMode: WorkflowExecuteMode, pushRef: string | undefined, runExecutionData: IRunExecutionData | undefined, executionId: string | undefined, req: WebhookRequest, res: express.Response, responseCallback: WebhookResponseCallback, destinationNode?: IDestinationNode, options?: {
    encryptedRunnerIdentity?: string;
    storedAt?: ExecutionStorageLocation;
    onResume?: () => void;
}): Promise<string | undefined>;
export declare function _privateGetWebhookErrorMessage(error: unknown, webhookType: 'Form' | 'Webhook'): string;
export {};
