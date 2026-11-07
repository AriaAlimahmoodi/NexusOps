import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { EndpointsConfig } from '@n8n/config';
import type { IExecutionResponse } from '@n8n/db';
import type express from 'express';
import { InstanceSettings } from 'n8n-core';
import { type INode, type IWorkflowBase, Workflow } from 'n8n-workflow';
import { WebhookService } from './webhook.service';
import type { IWebhookManager, IWebhookResponseCallbackData, WaitingWebhookRequest } from './webhook.types';
import { ExecutionPersistence } from '../executions/execution-persistence';
import { NodeTypes } from '../node-types';
export declare class WaitingWebhooks implements IWebhookManager {
    protected readonly logger: Logger;
    protected readonly nodeTypes: NodeTypes;
    private readonly executionPersistence;
    private readonly webhookService;
    protected readonly instanceSettings: InstanceSettings;
    private readonly eventService;
    private readonly endpointsConfig;
    protected includeForms: boolean;
    constructor(logger: Logger, nodeTypes: NodeTypes, executionPersistence: ExecutionPersistence, webhookService: WebhookService, instanceSettings: InstanceSettings, eventService: EventService, endpointsConfig: EndpointsConfig);
    findAccessControlOptions(): Promise<{
        allowedOrigins: string;
    }>;
    protected logReceivedWebhook(method: string, executionId: string): void;
    protected disableNode(execution: IExecutionResponse, _method?: string): void;
    private isSendAndWaitRequest;
    protected isFormResumeNode(node: Pick<INode, 'type' | 'parameters'>): boolean;
    private isFormResumeExecution;
    private redirectToFormWaiting;
    protected createWorkflow(workflowData: IWorkflowBase): Workflow;
    protected getExecution(executionId: string): Promise<IExecutionResponse | undefined>;
    private parseSignatureParam;
    protected validateToken(req: express.Request, execution: IExecutionResponse): {
        valid: boolean;
        webhookPath?: string;
    };
    protected validateSignature(req: express.Request): {
        valid: boolean;
        webhookPath?: string;
    };
    private stripTokenFromRequest;
    executeWebhook(req: WaitingWebhookRequest, res: express.Response): Promise<IWebhookResponseCallbackData>;
    private emitExecutionResumedEvent;
    protected getWebhookExecutionData({ execution, req, res, lastNodeExecuted, executionId, suffix, }: {
        execution: IExecutionResponse;
        req: WaitingWebhookRequest;
        res: express.Response;
        lastNodeExecuted: string;
        executionId: string;
        suffix?: string;
    }): Promise<IWebhookResponseCallbackData>;
}
