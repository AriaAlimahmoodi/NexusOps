import type { InstanceAiErrorEvent, InstanceAiEvent } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { type InstanceAiTraceContext, type ManagedBackgroundTask, type PatchableThreadMemory, type RunStateRegistry, type TerminalResponseDecision, type TerminalResponseStatus, type WorkSummary } from '@n8n/instance-ai';
import type { Telemetry } from '../../telemetry';
import type { InProcessEventBus } from './event-bus/in-process-event-bus';
import type { InstanceAiErrorReporterService } from './instance-ai-error-reporter.service';
import type { SuspendedThreadPersistenceService } from './suspended-thread-persistence.service';
import type { InstanceAiTracingService, MessageTraceFinalization } from './tracing/instance-ai-tracing.service';
type InstanceAiErrorCode = NonNullable<InstanceAiErrorEvent['payload']['code']>;
export type InstanceAiTerminalOutcomeEventBus = Pick<InProcessEventBus, 'publish'> & {
    getEventsForRun(threadId: string, runId: string): InstanceAiEvent[] | Promise<InstanceAiEvent[]>;
    getEventsForRuns(threadId: string, runIds: string[]): InstanceAiEvent[] | Promise<InstanceAiEvent[]>;
};
export type InstanceAiTerminalOutcomeTelemetry = Pick<Telemetry, 'track'>;
export type InstanceAiTerminalOutcomeErrorReporter = Pick<InstanceAiErrorReporterService, 'report'>;
export type InstanceAiTerminalOutcomeRunState = Pick<RunStateRegistry<User>, 'getRunIdsForMessageGroup' | 'cancelThread'>;
export type InstanceAiTerminalOutcomeSuspendedThreads = Pick<SuspendedThreadPersistenceService, 'dropPendingConfirmationsForThread'>;
export type InstanceAiTerminalOutcomeTracing = Pick<InstanceAiTracingService, 'finalizeRunTracing' | 'buildMessageTraceMetadata'>;
export interface InstanceAiTerminalOutcomeServiceOptions {
    eventBus: InstanceAiTerminalOutcomeEventBus;
    agentMemory: PatchableThreadMemory;
    telemetry: InstanceAiTerminalOutcomeTelemetry;
    errorReporter: InstanceAiTerminalOutcomeErrorReporter;
    logger: Logger;
    runState: InstanceAiTerminalOutcomeRunState;
    suspendedThreads: InstanceAiTerminalOutcomeSuspendedThreads;
    tracing: InstanceAiTerminalOutcomeTracing;
    publishRunFinish: (threadId: string, runId: string, status: 'completed' | 'cancelled' | 'errored', reason?: string, promptVersion?: string) => void;
}
export declare class InstanceAiTerminalOutcomeService {
    private readonly pendingTerminalOutcomes;
    private terminalOutcomeStorage?;
    private readonly eventBus;
    private readonly agentMemory;
    private readonly telemetry;
    private readonly errorReporter;
    private readonly logger;
    private readonly runState;
    private readonly suspendedThreads;
    private readonly tracing;
    private readonly publishRunFinish;
    constructor(options: InstanceAiTerminalOutcomeServiceOptions);
    evaluateTerminalResponse(threadId: string, runId: string, status: Exclude<TerminalResponseStatus, 'waiting'>, options?: {
        messageGroupId?: string;
        correlationId?: string;
        workSummary?: WorkSummary;
        errorMessage?: string;
        errorCode?: InstanceAiErrorCode;
        suppressCompletedFallback?: boolean;
    }): Promise<TerminalResponseDecision | undefined>;
    evaluateWaitingResponse(threadId: string, runId: string, confirmationEvent: Extract<InstanceAiEvent, {
        type: 'confirmation-request';
    }> | undefined, options?: {
        messageGroupId?: string;
        correlationId?: string;
    }): Promise<TerminalResponseDecision | undefined>;
    private getTerminalGuardEvents;
    private handleTerminalResponseDecision;
    private createTerminalOutcomeStorage;
    finishInvalidConfirmationRun(args: {
        threadId: string;
        runId: string;
        promptVersion?: string;
        abortController: AbortController;
        tracing?: InstanceAiTraceContext;
    }): Promise<MessageTraceFinalization>;
    private buildBackgroundTerminalOutcome;
    replayUndeliveredTerminalOutcomes(threadId: string): Promise<void>;
    private publishTerminalOutcomeLine;
    recordBackgroundTerminalOutcome(task: ManagedBackgroundTask): Promise<void>;
}
export {};
