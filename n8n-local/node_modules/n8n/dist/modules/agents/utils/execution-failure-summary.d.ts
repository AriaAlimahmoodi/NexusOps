import type { AgentExecutionStatus } from '@n8n/api-types';
import type { TimelineEvent } from '../execution-recorder';
export type AgentExecutionFailureKind = 'execution' | 'tool' | 'node' | 'workflow';
export interface AgentExecutionFailure {
    kind: AgentExecutionFailureKind;
    name: string | null;
    message: string | null;
    occurredAt: number;
}
export interface AgentExecutionFailureSummary {
    count: number;
    latest: AgentExecutionFailure;
}
export interface ThreadFailureSummary extends AgentExecutionFailureSummary {
    latest: AgentExecutionFailure & {
        executionId: string;
    };
}
export declare function computeExecutionFailureSummary({ timeline, status, error, stoppedAt, }: {
    timeline: TimelineEvent[];
    status: AgentExecutionStatus;
    error: string | null;
    stoppedAt: number;
}): AgentExecutionFailureSummary | null;
