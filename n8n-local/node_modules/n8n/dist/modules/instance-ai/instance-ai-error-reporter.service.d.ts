import type { AgentEventData } from '@n8n/agents';
import { Logger } from '@n8n/backend-common';
import { ErrorReporter } from 'n8n-core';
import { type InstanceAiObservabilityContext } from './observability';
export type InstanceAiErrorReportContext = {
    component: string;
    severity?: 'warning';
    providerStream?: boolean;
} & InstanceAiObservabilityContext;
type AgentErrorSource = NonNullable<Extract<AgentEventData, {
    error: unknown;
}>['source']>;
export declare function getAgentErrorSeverity(source: AgentErrorSource): 'warning' | undefined;
export declare class InstanceAiErrorReporterService {
    private readonly errorReporter;
    private readonly logger;
    private readonly reportedErrorsByRun;
    constructor(logger: Logger, errorReporter: ErrorReporter);
    beginRun(runId: string): symbol;
    endRun(runId: string, executionToken: symbol): void;
    endAllRuns(): void;
    report(error: unknown, context: InstanceAiErrorReportContext): void;
    withBoundary<T>(component: string, context: InstanceAiObservabilityContext, fn: () => Promise<T>): Promise<T>;
    private shouldSkipDuplicateReport;
}
export {};
