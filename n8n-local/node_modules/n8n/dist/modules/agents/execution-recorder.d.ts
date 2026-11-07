import type { StreamChunk } from '@n8n/agents';
import { type PersistedChildTrace, type AgentBackgroundJobSignal } from '@n8n/api-types';
import type { ToolRegistry, ToolRegistryEntry } from './tool-registry';
export declare function buildApprovalArgs(input: unknown, entry?: ToolRegistryEntry): unknown;
export interface RecordedUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export type TimelineEvent = {
    type: 'input';
    messageId: string;
    timestamp: number;
} | {
    type: 'background-task-signal';
    signal: AgentBackgroundJobSignal;
    timestamp: number;
} | {
    type: 'text';
    content: string;
    timestamp: number;
    endTime?: number;
} | {
    type: 'reasoning';
    content: string;
    timestamp: number;
    endTime?: number;
} | {
    type: 'tool-call';
    kind: ToolRegistryEntry['kind'];
    name: string;
    toolCallId: string;
    input: unknown;
    output: unknown;
    startTime: number;
    endTime: number;
    success: boolean;
    workflowId?: string;
    workflowName?: string;
    workflowExecutionId?: string;
    triggerType?: string;
    nodeType?: string;
    nodeTypeVersion?: number;
    nodeDisplayName?: string;
    nodeParameters?: Record<string, unknown>;
    childTrace?: PersistedChildTrace;
} | {
    type: 'suspension';
    toolName: string;
    toolCallId: string;
    timestamp: number;
    input?: unknown;
    suspendPayload?: unknown;
} | {
    type: 'hitl-response';
    toolCallId: string;
    response: unknown;
    timestamp: number;
};
export interface MessageRecord {
    assistantResponse: string;
    model: string | null;
    finishReason: string;
    usage: RecordedUsage | null;
    totalCost: number | null;
    timeline: TimelineEvent[];
    startTime: number;
    duration: number;
    error: string | null;
}
export declare class ExecutionRecorder {
    private readonly onTimelineSnapshot?;
    private readonly registry;
    constructor(registry?: ToolRegistry, onTimelineSnapshot?: ((timeline: TimelineEvent[]) => void) | undefined, backgroundJobSignal?: AgentBackgroundJobSignal, startedAt?: Date);
    private textParts;
    private textBuffer;
    private reasoningBuffer;
    private model;
    private finishReason;
    private usage;
    private totalCost;
    private timeline;
    private textStartTime;
    private reasoningStartTime;
    private timelineSnapshotTimer?;
    private _suspended;
    private error;
    private readonly startTime;
    private childTraceChars;
    recordInputs(events: Array<Extract<TimelineEvent, {
        type: 'input';
    }>>): void;
    recordHitlResponse(toolCallId: string, response: unknown): void;
    record(chunk: StreamChunk): void;
    get suspended(): boolean;
    get startedAt(): Date;
    getMessageRecord(): MessageRecord;
    private flushTextBuffer;
    private flushReasoningBuffer;
    private scheduleTimelineSnapshot;
    private recordToolCall;
    private recordToolExecutionStart;
    private recordToolExecutionEnd;
    private findOpenTimelineToolCall;
    private recordToolResult;
    private appendCompletedEvent;
    private emitTimelineSnapshot;
}
