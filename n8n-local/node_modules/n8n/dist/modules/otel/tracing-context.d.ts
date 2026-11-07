import { Logger } from '@n8n/backend-common';
import { ExecutionRepository } from '@n8n/db';
export type TracingContext = {
    traceparent: string;
    tracestate?: string;
    identity?: Record<string, string>;
};
export declare class TraceContextService {
    private readonly executionRepository;
    private readonly logger;
    constructor(executionRepository: ExecutionRepository, logger: Logger);
    persist(executionId: string, tracingContext: TracingContext): Promise<void>;
    get(executionId: string): Promise<TracingContext | undefined>;
}
