import { JsonStore } from '@n8n/blob-storage';
import { ErrorReporter, FsByteStoreService } from 'n8n-core';
import type { TimelineEvent } from '../execution-recorder';
export type AgentExecutionLogRef = {
    agentId: string;
    threadId: string;
    executionId: string;
};
export type AgentExecutionLogPayload = {
    timeline: TimelineEvent[];
};
export declare class AgentExecutionLogStore extends JsonStore<AgentExecutionLogRef, AgentExecutionLogPayload> {
    constructor(fsByteStore: FsByteStoreService, errorReporter: ErrorReporter);
}
