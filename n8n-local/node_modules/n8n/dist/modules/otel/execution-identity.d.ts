import type { Context } from '@opentelemetry/api';
import type { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR } from './otel.constants';
export type ExecutionIdentity = {
    [ATTR.EXECUTION_ID]: string;
    [ATTR.WORKFLOW_ID]: string;
    [ATTR.WORKFLOW_NAME]?: string;
    [ATTR.PROJECT_ID]?: string;
    [ATTR.PROJECT_NAME]?: string;
};
type ExecutionIdentitySource = {
    executionId: string;
    workflowId: string;
    workflowName?: string;
    projectId?: string;
    projectName?: string;
};
export declare function buildExecutionIdentity(source: ExecutionIdentitySource): ExecutionIdentity;
export declare function toExecutionIdentity(value: unknown): ExecutionIdentity | undefined;
export declare function withExecutionIdentity(ctx: Context, identity: ExecutionIdentity): Context;
export declare class ExecutionIdentitySpanProcessor implements SpanProcessor {
    onStart(span: Span, parentContext: Context): void;
    onEnd(_span: ReadableSpan): void;
    forceFlush(): Promise<void>;
    shutdown(): Promise<void>;
}
export {};
