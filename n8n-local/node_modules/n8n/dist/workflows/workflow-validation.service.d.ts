import type { User } from '@n8n/db';
import { CredentialsRepository, WorkflowRepository } from '@n8n/db';
import type { INode, INodes, IConnections, IWorkflowSettings } from 'n8n-workflow';
import { CredentialTypes } from '../credential-types';
import { DynamicCredentialsProxy } from '../credentials/dynamic-credentials-proxy';
import { CredentialsPermissionChecker } from '../executions/pre-execution-checks/credentials-permission-checker';
import type { NodeTypes } from '../node-types';
export interface WorkflowValidationResult {
    isValid: boolean;
    error?: string;
}
export interface SubWorkflowValidationResult extends WorkflowValidationResult {
    invalidReferences?: Array<{
        nodeName: string;
        workflowId: string;
        workflowName?: string;
    }>;
}
export interface WorkflowStatus {
    exists: boolean;
    isPublished: boolean;
    name?: string;
}
export declare class WorkflowValidationService {
    private readonly workflowRepository;
    private readonly credentialsRepository;
    private readonly dynamicCredentialsProxy;
    private readonly credentialTypes;
    private readonly credentialsPermissionChecker;
    constructor(workflowRepository: WorkflowRepository, credentialsRepository: CredentialsRepository, dynamicCredentialsProxy: DynamicCredentialsProxy, credentialTypes: CredentialTypes, credentialsPermissionChecker: CredentialsPermissionChecker);
    private executableNodeNames;
    private validateNodeConfiguration;
    private validateNodeParameters;
    validateCredentialNodeRestrictions(nodes: INode[]): WorkflowValidationResult;
    validateTriggerNodeIds(triggerNodes: INode[]): WorkflowValidationResult;
    private getActiveCredentialTypes;
    validateForActivation(nodes: INodes, connections: IConnections, nodeTypes: NodeTypes): Promise<WorkflowValidationResult>;
    validateRequiredInputsConnected(nodes: INode[], connections: IConnections, nodeTypes: NodeTypes): Promise<WorkflowValidationResult>;
    validateDynamicCredentials(nodes: INode[], nodeTypes: NodeTypes, workflowSettings?: IWorkflowSettings): Promise<WorkflowValidationResult>;
    validatePublisherCredentialAccess(user: User, nodes: INode[], workflowId: string): Promise<WorkflowValidationResult>;
    private getDynamicCredentialsError;
    private getN8nUserAuthTriggersList;
    private collectCredentialIds;
    private classifyTriggerIdentities;
    validateSubWorkflowReferences(workflowId: string, nodes: INode[]): Promise<SubWorkflowValidationResult>;
    private getWorkflowStatus;
    private hasValueProperty;
    private extractWorkflowId;
    private shouldSkipSubWorkflowValidation;
}
