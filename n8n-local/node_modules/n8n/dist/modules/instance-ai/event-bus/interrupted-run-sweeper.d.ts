import type { InstanceAiEvent } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import { DurableLogMetrics } from './durable-log-metrics';
import { InProcessEventBus } from './in-process-event-bus';
import { InstanceAiCheckpointRepository } from '../repositories/instance-ai-checkpoint.repository';
import { InstanceAiEventLogRepository } from '../repositories/instance-ai-event-log.repository';
export declare const TOOL_INTERRUPTED_MESSAGE = "Interrupted by a process restart \u2014 effect unverified; verify before retrying.";
export declare const AGENT_INTERRUPTED_MESSAGE = "Interrupted by a process restart.";
interface InFlightToolCall {
    toolCallId: string;
    toolName: string;
    agentId: string;
    args: Record<string, unknown>;
}
interface OrphanedSpawnedAgent {
    agentId: string;
    role: string;
}
export interface InterruptedRunResumeHost {
    isRunLive(threadId: string, runId: string): boolean;
}
export declare class InterruptedRunSweeper {
    private readonly logger;
    private readonly eventLogRepo;
    private readonly checkpointRepo;
    private readonly eventBus;
    private readonly metrics;
    private readonly instanceSettings;
    static readonly LIVENESS_GRACE_MS: number;
    private resumeHost;
    constructor(logger: Logger, eventLogRepo: InstanceAiEventLogRepository, checkpointRepo: InstanceAiCheckpointRepository, eventBus: InProcessEventBus, metrics: DurableLogMetrics, instanceSettings: InstanceSettings);
    setResumeHost(host: InterruptedRunResumeHost): void;
    sweep(): Promise<void>;
    private sweepRun;
    cancelUnfinishedRuns(threadId: string): Promise<number>;
    private resolveZombieRun;
}
export declare function collectOrphanedSpawnedAgents(events: InstanceAiEvent[]): OrphanedSpawnedAgent[];
export declare function collectInFlightToolCalls(events: InstanceAiEvent[]): InFlightToolCall[];
export {};
