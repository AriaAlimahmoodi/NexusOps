import type { IDataObject, IExecuteFunctions, ILoadOptionsFunctions, INode } from 'n8n-workflow';
import type { AgentParametersInput, AgentResultResponse, AirtopAgentResponse } from './agent.types';
/**
 * Gets the agent input parameters schema.
 */
export declare function getAgentDetails(this: IExecuteFunctions | ILoadOptionsFunctions, agentId: string): Promise<AirtopAgentResponse>;
/**
 * Validates the agent parameters with the schema.
 */
export declare function validateAgentParameters(this: IExecuteFunctions, params: AgentParametersInput): IDataObject;
/**
 * Gets the agent status
 */
export declare function getAgentStatus(this: IExecuteFunctions, agentId: string, invocationId: string): Promise<AgentResultResponse>;
/**
 * Polls the agent execution status until it's completed or fails.
 */
export declare function pollAgentStatus(this: IExecuteFunctions, agentId: string, invocationId: string, timeoutSeconds: number): Promise<AgentResultResponse | undefined>;
/**
 * Throws an operation error if the statement is true.
 */
export declare function throwOperationErrorIf(statement: boolean, message: string, node: INode): void;
//# sourceMappingURL=agent.utils.d.ts.map