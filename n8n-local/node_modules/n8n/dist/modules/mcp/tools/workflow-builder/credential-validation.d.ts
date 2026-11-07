import type { User } from '@n8n/db';
import type { INode, IWorkflowBase } from 'n8n-workflow';
import type { CredentialsService } from '../../../../credentials/credentials.service';
import type { NodeTypes } from '../../../../node-types';
import type { PartialUpdateOperation } from './workflow-operations';
export interface CredentialValidationFailure {
    ok: false;
    opIndex: number;
    error: string;
}
export interface CredentialValidationSuccess {
    ok: true;
}
export type CredentialValidationResult = CredentialValidationSuccess | CredentialValidationFailure;
export interface WorkflowCredentialValidationFailure {
    ok: false;
    error: string;
}
export type WorkflowCredentialValidationResult = CredentialValidationSuccess | WorkflowCredentialValidationFailure;
export type CredentialProjectScope = {
    workflowId: string;
} | {
    projectId: string;
};
export declare function validateCredentialReferences(operations: PartialUpdateOperation[], existingWorkflow: IWorkflowBase, user: User, credentialsService: CredentialsService, nodeTypes: NodeTypes, scope: CredentialProjectScope): Promise<CredentialValidationResult>;
export declare function validateWorkflowCredentialReferences(nodes: INode[], user: User, credentialsService: CredentialsService, nodeTypes: NodeTypes, projectId: string): Promise<WorkflowCredentialValidationResult>;
