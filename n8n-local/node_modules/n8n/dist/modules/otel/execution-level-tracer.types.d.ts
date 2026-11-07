import type { ExecutionStatus, WorkflowExecuteMode, INode } from 'n8n-workflow';
import type { CrashDetector } from '../../events/maps/relay.event-map';
import type { ExecutionIdentity } from './execution-identity';
import type { TracingContext } from './tracing-context';
export type CustomAttributes = Record<string, string>;
export type ProjectContext = {
    id: string;
    name?: string;
    customAttributes?: CustomAttributes;
};
type WorkflowContext = {
    id: string;
    name: string;
    versionId?: string;
    nodeCount: number;
    customAttributes?: CustomAttributes;
};
export type StartWorkflowParams = {
    executionId: string;
    tracingContext?: TracingContext;
    linkTo?: TracingContext;
    savedIdentity?: ExecutionIdentity;
    workflow: WorkflowContext;
    project?: ProjectContext;
    emitStartSpan?: boolean;
};
export type EndWorkflowParams = {
    executionId: string;
    status: ExecutionStatus;
    mode: WorkflowExecuteMode;
    error?: unknown;
    isRetry: boolean;
    retryOf?: string;
};
export type EndCrashedWorkflowParams = {
    executionId: string;
    workflowId: string;
    workflowName?: string;
    workflowVersionId?: string;
    mode: WorkflowExecuteMode;
    retryOf?: string;
    detector: CrashDetector;
    startedAt?: Date;
    stoppedAt: Date;
    tracingContext?: TracingContext;
    workflow?: {
        customAttributes?: CustomAttributes;
    };
    project?: ProjectContext;
};
type NodeTracingParams = Pick<INode, 'id' | 'name' | 'type' | 'typeVersion'>;
export type StartNodeParams = {
    executionId: string;
    node: NodeTracingParams;
    emitStartSpan?: boolean;
};
type EndNodeError = {
    message: string;
    constructor: {
        name: string;
    };
    stack?: string;
    name?: string;
    description?: string | null;
};
export declare function isEndNodeError(error: unknown): error is EndNodeError;
export type EndNodeParams = {
    executionId: string;
    node: NodeTracingParams;
    inputItemCount: number;
    outputItemCount: number;
    error?: EndNodeError;
    customAttributes?: Record<string, string>;
};
export {};
