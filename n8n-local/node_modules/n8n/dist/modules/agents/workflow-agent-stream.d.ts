import { type StreamChunk } from '@n8n/agents';
import type { AgentNodeCapability } from '@n8n/api-types';
import type { ExecuteAgentInvocationContext, IWorkflowExecuteAdditionalData } from 'n8n-workflow';
type WorkflowAgentStreamEvent = {
    type: 'response-begin';
} | {
    type: 'response-delta';
    delta: string;
} | {
    type: 'response-end';
} | {
    type: 'capability-start';
    toolCallId: string;
    capability: AgentNodeCapability;
} | {
    type: 'capability-end';
    toolCallId: string;
    capability: AgentNodeCapability;
    status: 'succeeded' | 'failed';
};
export type WorkflowAgentStreamObserver = (event: WorkflowAgentStreamEvent) => Promise<void>;
export type PendingTool = {
    toolName: string;
    input: unknown;
};
export declare function createWorkflowAgentStreamObserver({ additionalData, executionId, invocation, }: {
    additionalData: IWorkflowExecuteAdditionalData;
    executionId: string;
    invocation: ExecuteAgentInvocationContext;
}): WorkflowAgentStreamObserver;
export declare class WorkflowAgentStreamAdapter {
    private readonly observer?;
    private openTextId;
    private readonly pendingTools;
    private readonly runningCapabilities;
    constructor(observer?: WorkflowAgentStreamObserver | undefined);
    observe(chunk: StreamChunk): Promise<void>;
    fail(): void;
    private beginText;
    private endText;
    private startCapability;
    private endCapability;
    private emit;
}
export {};
