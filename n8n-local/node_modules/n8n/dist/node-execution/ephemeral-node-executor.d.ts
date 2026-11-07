import { Logger } from '@n8n/backend-common';
import { CredentialsRepository, SharedCredentialsRepository } from '@n8n/db';
import type { INodeCredentialsDetails, INodeExecutionData, INodeParameters, IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import { NodeTypes } from '../node-types';
import { PolicyEnforcementService } from '../policy/policy-enforcement.service';
import { type NonEmptyViolations } from '../policy/policy-violation.error';
export type EphemeralWorkflowToolLike = {
    projectId: string;
    nodeType: string;
    nodeTypeVersion: number;
    nodeParameters: INodeParameters;
    credentials?: Record<string, INodeCredentialsDetails> | null;
    nodeName?: string;
    configureAdditionalData?: (additionalData: IWorkflowExecuteAdditionalData) => void;
};
export interface InlineNodeExecutionRequest {
    nodeType: string;
    nodeTypeVersion: number;
    nodeParameters: INodeParameters;
    credentials?: Record<string, string>;
    credentialDetails?: Record<string, INodeCredentialsDetails>;
    inputData: INodeExecutionData[];
    projectId: string;
    nodeName?: string;
    configureAdditionalData?: (additionalData: IWorkflowExecuteAdditionalData) => void;
}
export interface NodeExecutionResult {
    status: 'success' | 'error';
    data: INodeExecutionData[];
    error?: string;
    violations?: NonEmptyViolations;
}
export declare const AGENT_TOOL_NODE_DENYLIST: Set<string>;
export declare const AGENT_PROVIDER_NODE_WHITELIST: Set<string>;
export declare function isAgentProviderNode(nodeType: string): boolean;
export declare function isUsableAsAgentTool(description: {
    usableAsTool?: unknown;
    outputs?: unknown;
}): boolean;
export declare class EphemeralNodeExecutor {
    private readonly nodeTypes;
    private readonly credentialsRepository;
    private readonly sharedCredentialsRepository;
    private readonly logger;
    private readonly policyEnforcementService;
    constructor(nodeTypes: NodeTypes, credentialsRepository: CredentialsRepository, sharedCredentialsRepository: SharedCredentialsRepository, logger: Logger, policyEnforcementService: PolicyEnforcementService);
    private resolveInlineCredentials;
    private verifyCredentialDetailsForProject;
    private validateNodeForExecution;
    private enforceRunPolicy;
    private buildEphemeralContextParts;
    private executeNodeDirectly;
    evaluateExpressions(tool: EphemeralWorkflowToolLike, expressions: Record<string, string>, inputItems: INodeExecutionData[]): Promise<Record<string, unknown>>;
    executeInline(request: InlineNodeExecutionRequest): Promise<NodeExecutionResult>;
    private withSupplyDataTool;
    private invokeSupplyDataTool;
    introspectSupplyDataToolSchema(tool: EphemeralWorkflowToolLike): Promise<unknown>;
}
