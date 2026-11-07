import type { UnsubscribeExecutionResponse } from './execution-response-receiver';
export declare class InMemoryExecutionResponseChannel {
    private readonly emitter;
    publish(executionId: string, frame: string): void;
    subscribe(executionId: string, handler: (frame: string) => void): UnsubscribeExecutionResponse;
}
