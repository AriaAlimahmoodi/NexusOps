import type { InstanceAiRunLimitReason } from '@n8n/api-types';
export type InstanceAiEventMap = {
    'instance-ai-durable-log-drained': {
        rows: number;
        bytes: number;
    };
    'instance-ai-durable-log-queue-latency': {
        ms: number;
    };
    'instance-ai-durable-log-append-conflict': {
        attempt: number;
    };
    'instance-ai-durable-log-append-failure': {
        events: number;
    };
    'instance-ai-durable-log-replayed': {
        events: number;
        cursorAgeEvents: number;
    };
    'instance-ai-history-folded': {
        latencyMs: number;
        trees: number;
    };
    'instance-ai-run-refused': {
        reason: InstanceAiRunLimitReason;
    };
    'instance-ai-run-swept': {
        outcome: 'interrupted' | 'crash-resumed';
        toolInterruptedFacts: number;
    };
    'instance-ai-run-finished': {
        status: 'completed' | 'cancelled' | 'error' | 'suspended';
        durationMs?: number;
        model: string;
        toolCalls: number;
        toolErrors: number;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
            costUsd: number;
        };
    };
};
