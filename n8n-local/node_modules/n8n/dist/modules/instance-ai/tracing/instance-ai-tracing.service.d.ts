import type { InstanceAiEvent } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { type BrowserExtensionTraceContext, type InstanceAiTraceContext, type ManagedBackgroundTask, type ModelConfig, type RunStateRegistry, type ServiceProxyConfig } from '@n8n/instance-ai';
import type { AiService } from '../../../services/ai.service';
import { type InstanceAiRunTraceMetadataOptions } from '../run-trace-metadata';
import type { InstanceAiEventLogRepository } from '../repositories/instance-ai-event-log.repository';
export interface MessageTraceFinalization {
    status: 'completed' | 'cancelled' | 'error' | 'suspended';
    outputText?: string;
    reason?: string;
    modelId?: ModelConfig;
    outputs?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    error?: string;
}
export type OrchestratorResumeReason = 'approval' | 'background_task_completed' | 'workflow_verification' | 'workflow_setup' | 'planned_checkpoint' | 'replan' | 'synthesize';
export type InstanceAiTracingEventReader = {
    getEventsForRun: (threadId: string, runId: string) => Promise<InstanceAiEvent[]>;
};
export type InstanceAiTracingRunState = Pick<RunStateRegistry<User>, 'attachTracing'>;
export type InstanceAiTracingEventLog = Pick<InstanceAiEventLogRepository, 'findLangsmithAnchor'>;
export type InstanceAiTracingAiService = Pick<AiService, 'isProxyEnabled' | 'getClient'>;
export type InstanceAiTracingServiceOptions = {
    logger: Logger;
    eventReader: InstanceAiTracingEventReader;
    runState: InstanceAiTracingRunState;
    eventLog: InstanceAiTracingEventLog;
    aiService: InstanceAiTracingAiService;
};
export declare class InstanceAiTracingService {
    private readonly traceContextsByRunId;
    private readonly traceReplay;
    private readonly logger;
    private readonly eventReader;
    private readonly runState;
    private readonly eventLog;
    private readonly aiService;
    constructor(options: InstanceAiTracingServiceOptions);
    storeTraceContext(runId: string, threadId: string, tracing: InstanceAiTraceContext, messageGroupId?: string): void;
    getTraceContext(runId: string): InstanceAiTraceContext | undefined;
    getMessageGroupId(runId: string): string | undefined;
    getTrackedThreadIds(): string[];
    clear(): void;
    getTraceContextForContinuation(threadId: string, messageGroupId?: string): InstanceAiTraceContext | undefined;
    registerTraceContext(runId: string, threadId: string, tracing: InstanceAiTraceContext, messageGroupId?: string): void;
    createOrchestratorResumeTraceContext(options: {
        baseTracing?: InstanceAiTraceContext;
        threadId: string;
        messageId: string;
        messageGroupId?: string;
        runId: string;
        userId: string;
        modelId?: ModelConfig;
        input: Record<string, unknown>;
        proxyConfig?: ServiceProxyConfig;
        resumeReason: OrchestratorResumeReason;
        metadata?: Record<string, unknown>;
        browserExtension?: BrowserExtensionTraceContext;
        register?: boolean;
    }): Promise<InstanceAiTraceContext | undefined>;
    configureTraceReplayMode(tracing: InstanceAiTraceContext): Promise<void>;
    finalizeMessageTraceRoot(runId: string, tracing: InstanceAiTraceContext, options: MessageTraceFinalization): Promise<void>;
    maybeFinalizeRunTraceRoot(runId: string, options: MessageTraceFinalization): Promise<void>;
    buildMessageTraceMetadata(threadId: string, runId: string, options: InstanceAiRunTraceMetadataOptions): Promise<Record<string, unknown>>;
    finalizeRemainingMessageTraceRoots(threadId: string, options: MessageTraceFinalization): Promise<void>;
    deleteTraceContextsForThread(threadId: string): void;
    private deleteTraceContextsForSlug;
    clearTraceContextsForTest(): void;
    finalizeDetachedTraceRun(taskId: string, traceContext: InstanceAiTraceContext | undefined, options: {
        status: 'completed' | 'failed' | 'cancelled';
        outputs?: Record<string, unknown>;
        error?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    finalizeRunTracing(runId: string, tracing: InstanceAiTraceContext | undefined, options: MessageTraceFinalization): Promise<void>;
    finalizeBackgroundTaskTracing(task: ManagedBackgroundTask, status: 'completed' | 'failed' | 'cancelled'): Promise<void>;
    submitLangsmithFeedback(user: User, threadId: string, responseId: string, payload: {
        rating: 'up' | 'down';
        comment?: string;
    }): Promise<void>;
    loadTraceEvents(slug: string, events: unknown[]): void;
    getTraceEvents(slug: string): unknown[];
    activateTraceSlug(slug: string): void;
    clearTraceEvents(slug: string): void;
}
