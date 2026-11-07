import type { ExecutionResponse, ResponseExpectation, StepSlots } from '@n8n/engine';
export type LastNode = {
    nodeName: string;
    outputs: StepSlots;
};
export type WebhookRunOutcome = {
    status: 'response';
    response: unknown;
} | {
    status: 'completed';
    lastNode?: LastNode;
} | {
    status: 'failed';
    nodeId: string;
    nodeName: string;
    error?: {
        name: string;
        message: string;
    };
} | {
    status: 'undeliverable';
    error: {
        name: string;
        message: string;
    };
} | {
    status: 'cancelled';
} | {
    status: 'timeout';
};
export declare function toWebhookOutcome(received: ExecutionResponse, expectation: ResponseExpectation): WebhookRunOutcome | undefined;
