import type { InstanceAiEvent } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import { type InstanceAiLivenessPolicy, type InstanceAiLivenessTimeoutReason } from '@n8n/instance-ai';
import type { InstanceAiRunTimeoutDetails } from '../run-timeout-details';
export declare const INSTANCE_AI_RUN_TIMEOUT_REASON = "timeout";
export type InstanceAiLivenessTimedOutActiveRun = {
    runId: string;
    abortController: AbortController;
};
export type InstanceAiLivenessTimedOutSuspendedRun = {
    runId: string;
    threadId: string;
    abortController: AbortController;
};
export type InstanceAiLivenessTimedOutTask = {
    threadId: string;
    taskId: string;
    role: string;
    timeoutReason?: InstanceAiLivenessTimeoutReason;
};
export type InstanceAiLivenessPendingConfirmation = {
    threadId: string;
};
export type InstanceAiLivenessSweepResult = {
    activeThreadIds: string[];
    suspendedThreadIds: string[];
    confirmationRequestIds: string[];
    activeTimeouts?: Record<string, InstanceAiRunTimeoutDetails>;
    suspendedTimeouts?: Record<string, InstanceAiRunTimeoutDetails>;
    confirmationTimeouts?: Record<string, InstanceAiRunTimeoutDetails>;
};
export type InstanceAiConsumedRunTimeout = {
    timedOut: boolean;
    details?: InstanceAiRunTimeoutDetails;
};
export type InstanceAiLivenessRunState<TSuspendedRun extends InstanceAiLivenessTimedOutSuspendedRun> = {
    sweepTimedOut: (policy: InstanceAiLivenessPolicy, now?: number) => InstanceAiLivenessSweepResult;
    cancelActiveRun: (threadId: string) => InstanceAiLivenessTimedOutActiveRun | undefined;
    cancelSuspendedRun: (threadId: string) => TSuspendedRun | undefined;
    getActiveRunId: (threadId: string) => string | undefined;
    getPendingConfirmation: (requestId: string) => InstanceAiLivenessPendingConfirmation | undefined;
    hasPendingConfirmationForThread: (threadId: string) => boolean;
    rejectPendingConfirmation: (requestId: string) => boolean;
};
export type InstanceAiLivenessBackgroundTasks = {
    timeoutTimedOutTasks: (policy: InstanceAiLivenessPolicy, now?: number, options?: {
        shouldSkipTask?: (task: InstanceAiLivenessTimedOutTask) => boolean;
    }) => Promise<InstanceAiLivenessTimedOutTask[]>;
};
export type InstanceAiLivenessEventBus = {
    publish: (threadId: string, event: InstanceAiEvent) => void;
};
export type InstanceAiLivenessServiceOptions<TSuspendedRun extends InstanceAiLivenessTimedOutSuspendedRun> = {
    policy: InstanceAiLivenessPolicy;
    backgroundTaskIdleTimeoutMs: number;
    runState: InstanceAiLivenessRunState<TSuspendedRun>;
    backgroundTasks: InstanceAiLivenessBackgroundTasks;
    eventBus: InstanceAiLivenessEventBus;
    finalizeCancelledSuspendedRun: (suspended: TSuspendedRun, reason: string) => void;
    onPendingConfirmationRejected?: (requestId: string) => void;
    logger: Logger;
};
export declare class InstanceAiLivenessService<TSuspendedRun extends InstanceAiLivenessTimedOutSuspendedRun> {
    private readonly options;
    private timeoutInterval?;
    private readonly timedOutRunIds;
    private readonly timedOutActiveRunThreads;
    private readonly noticedRunIds;
    static readonly NOTICE_DEDUPE_CACHE_SIZE = 1000;
    constructor(options: InstanceAiLivenessServiceOptions<TSuspendedRun>);
    get backgroundTaskIdleTimeoutMs(): number;
    start(): void;
    shutdown(): void;
    clearThreadState(threadId: string): void;
    markRunTimedOut(runId: string, details?: InstanceAiRunTimeoutDetails): void;
    consumeRunTimedOut(runId: string): boolean;
    consumeRunTimeout(runId: string): InstanceAiConsumedRunTimeout;
    hasTimedOutActiveRunThread(threadId: string): boolean;
    sweepTimedOutWork(now?: number): Promise<void>;
    cancelTimedOutActiveRun(threadId: string, details?: InstanceAiRunTimeoutDetails): void;
    cancelTimedOutSuspendedRun(threadId: string, details?: InstanceAiRunTimeoutDetails): void;
    publishRunTimeoutNotice(threadId: string, runId: string): void;
    private rememberNoticedRunId;
}
