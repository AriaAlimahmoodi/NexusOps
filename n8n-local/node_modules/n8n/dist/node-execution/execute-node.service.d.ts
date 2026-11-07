import { Logger } from '@n8n/backend-common';
import { WorkflowRepository } from '@n8n/db';
import type { User } from '@n8n/db';
import { InstanceSettings } from 'n8n-core';
import type { IDataObject, INodeCredentials, INodeParameters } from 'n8n-workflow';
import { ActiveExecutions } from '../active-executions';
import { CredentialsFinderService } from '@n8n/backend-services';
import { ExecutionPersistence } from '../executions/execution-persistence';
import { NodeTypes } from '../node-types';
import { WorkflowRunner } from '../workflow-runner';
import { DeprecatedNodesValidationService } from '../workflows/deprecated-nodes-validation.service';
export declare const DEFAULT_EXECUTE_NODE_TIMEOUT_MS = 30000;
export declare const MAX_EXECUTE_NODE_TIMEOUT_MS = 60000;
export interface ExecuteNodeRequest {
    type: string;
    version: number;
    config: {
        parameters: INodeParameters;
        credentials?: INodeCredentials;
    };
    input?: Array<{
        json: IDataObject;
    }>;
    timeoutMs?: number;
    projectId: string;
}
export interface ExecuteNodeOutputItem {
    json: IDataObject;
    binary?: Record<string, {
        fileName?: string;
        mimeType?: string;
        fileSize?: string;
    }>;
}
export interface ExecuteNodeError {
    message: string;
    description?: string;
    nodeErrorType?: string;
}
export type ExecuteNodeResult = {
    status: 'success';
    output: ExecuteNodeOutputItem[][];
} | {
    status: 'error';
    error: ExecuteNodeError;
};
export declare class ExecuteNodeService {
    private readonly nodeTypes;
    private readonly credentialsFinderService;
    private readonly logger;
    private readonly workflowRepository;
    private readonly workflowRunner;
    private readonly activeExecutions;
    private readonly executionPersistence;
    private readonly instanceSettings;
    private readonly deprecatedNodesValidationService;
    constructor(nodeTypes: NodeTypes, credentialsFinderService: CredentialsFinderService, logger: Logger, workflowRepository: WorkflowRepository, workflowRunner: WorkflowRunner, activeExecutions: ActiveExecutions, executionPersistence: ExecutionPersistence, instanceSettings: InstanceSettings, deprecatedNodesValidationService: DeprecatedNodesValidationService);
    run(user: User, request: ExecuteNodeRequest): Promise<ExecuteNodeResult>;
    private resolveNodeType;
    private assertExecutable;
    private normalizeCredentials;
    private checkCredentialAccess;
    private buildNode;
    private createTemporaryWorkflow;
    private deleteTemporaryWorkflow;
    private warnCleanupFailed;
    private execute;
    private waitForCompletion;
    private waitForSettled;
    private extractResult;
    private toOutput;
    private toOutputItem;
    private toErrorResponse;
}
