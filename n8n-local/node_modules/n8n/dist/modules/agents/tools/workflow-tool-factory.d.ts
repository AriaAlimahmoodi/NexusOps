import type { BuiltTool } from '@n8n/agents';
import { type AgentJsonToolConfig } from '@n8n/api-types';
import type { WorkflowEntity } from '@n8n/db';
import type { INode, RelatedAgentRun, WorkflowExecuteMode } from 'n8n-workflow';
import { z } from 'zod';
import type { ActiveExecutions } from '../../../active-executions';
import type { SubworkflowPolicyChecker } from '../../../executions/pre-execution-checks';
import type { EphemeralNodeExecutor } from '../../../node-execution/ephemeral-node-executor';
import type { WorkflowRunner } from '../../../workflow-runner';
import type { InstrumentToolAdditionalData } from '../agent-runtime-instrumentation';
import type { WorkflowToolWorkflowLoader } from './workflow-tool-workflow-loader.service';
interface WorkflowWaitState {
    waitTill?: Date;
}
interface WorkflowToolResult {
    executionId: string;
    status: string;
    data?: Record<string, unknown>;
    error?: string;
    note?: string;
}
export interface WorkflowToolExecutionResult extends WorkflowToolResult {
    wait?: WorkflowWaitState;
}
export type WorkflowToolExecutionMode = Extract<WorkflowExecuteMode, 'manual' | 'integrated'>;
export interface WorkflowToolContext {
    workflowLoader: WorkflowToolWorkflowLoader;
    executor: EphemeralNodeExecutor;
    workflowRunner: WorkflowRunner;
    subworkflowPolicyChecker: SubworkflowPolicyChecker;
    activeExecutions: ActiveExecutions;
    projectId: string;
    executionMode: WorkflowToolExecutionMode;
    usePublishedWorkflowVersion?: boolean;
    agentId?: string;
    integrationType?: string;
    previewChat?: boolean;
    publishedN8nChat?: boolean;
    userId?: string;
    supportsHitl?: boolean;
    backgroundTasksEnabled?: boolean;
    instrumentToolAdditionalData?: InstrumentToolAdditionalData;
}
export interface WorkflowToolRunContext extends WorkflowToolContext {
    abortSignal?: AbortSignal;
    agentRun?: RelatedAgentRun;
}
interface DetectedTrigger {
    node: INode;
    triggerType: string;
}
export declare function detectTriggerNode(workflow: WorkflowEntity): DetectedTrigger;
export declare function validateCompatibility(workflow: WorkflowEntity): void;
export type WorkflowInputFieldDef = {
    name: string;
    type?: string;
};
export declare function listWorkflowInputFields(triggerNode: INode): WorkflowInputFieldDef[];
export declare function inferInputSchema(triggerNode: INode, triggerType: string): z.ZodObject<z.ZodRawShape>;
type WorkflowToolInputsConfig = NonNullable<Extract<AgentJsonToolConfig, {
    type: 'workflow';
}>['inputs']>;
export declare function getFixedWorkflowToolInputs(inputs: WorkflowToolInputsConfig | undefined): Record<string, unknown>;
export declare function buildWorkflowToolInputSchema(schema: z.ZodObject<z.ZodRawShape>, inputs: WorkflowToolInputsConfig | undefined): z.ZodObject<z.ZodRawShape>;
export declare function mergeWorkflowToolInput(llmInput: Record<string, unknown>, inputs: WorkflowToolInputsConfig | undefined, fullSchema: z.ZodObject<z.ZodRawShape>, expressionValues?: Record<string, unknown>): Record<string, unknown>;
export declare function executeWorkflow(workflow: WorkflowEntity, triggerNode: INode, inputData: Record<string, unknown>, context: WorkflowToolRunContext, allOutputs?: boolean, instrumentedToolName?: string): Promise<WorkflowToolExecutionResult>;
export declare function extractResult(executionId: string, allOutputs: boolean): Promise<WorkflowToolExecutionResult>;
export declare function resolveWorkflowTool(descriptor: Extract<AgentJsonToolConfig, {
    type: 'workflow';
}>, context: WorkflowToolContext): Promise<BuiltTool>;
export declare function buildUnavailableWorkflowTool(descriptor: Extract<AgentJsonToolConfig, {
    type: 'workflow';
}>, context: WorkflowToolContext): BuiltTool;
export {};
