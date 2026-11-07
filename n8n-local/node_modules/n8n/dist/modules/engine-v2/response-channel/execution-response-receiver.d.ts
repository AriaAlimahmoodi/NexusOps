import type { ExecutionResponse } from '@n8n/engine';
export type UnsubscribeExecutionResponse = () => void;
export interface ExecutionResponseReceiver {
    receive(executionId: string, handler: (response: ExecutionResponse) => void): Promise<UnsubscribeExecutionResponse>;
    stop(): Promise<void>;
}
