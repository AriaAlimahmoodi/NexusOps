import type { InstanceAiEvent } from '@n8n/api-types';
import type { InstanceAiLivenessTimeoutReason } from '@n8n/instance-ai';
import type { InstanceAiRunTimeoutDetails } from './run-timeout-details';
export type InstanceAiFirstVisibleState = 'assistant_text' | 'contextless_hitl' | 'tool_call' | 'task_card' | 'empty';
export type InstanceAiCancellationType = 'explicit' | InstanceAiLivenessTimeoutReason;
export type InstanceAiRunTimeoutTraceContext = {
    timedOut: boolean;
    details?: InstanceAiRunTimeoutDetails;
};
export type InstanceAiRunTraceMetadataOptions = {
    status: 'completed' | 'cancelled' | 'error';
    cancellationReason?: string;
    runTimeout?: InstanceAiRunTimeoutTraceContext;
};
export declare function buildInstanceAiRunTraceMetadata(events: InstanceAiEvent[], options: InstanceAiRunTraceMetadataOptions): Record<string, unknown>;
