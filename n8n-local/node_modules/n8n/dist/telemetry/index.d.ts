import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { GlobalConfig } from '@n8n/config';
import { WorkflowRepository } from '@n8n/db';
import type { InferTelemetryProps, TelemetryEventDef } from '@n8n/telemetry';
import { ErrorReporter, InstanceSettings } from 'n8n-core';
import type { ITelemetryTrackProperties } from 'n8n-workflow';
import type { AgentRunTelemetryType, IAgentConfigurationTelemetryProperties, IAgentExecutionTrackProperties, IAgentTurnFinishedTrackProperties, IExecutionTrackProperties } from '../interfaces';
import { License } from '../license';
import { PostHogClient } from '../posthog';
type ExecutionTrackDataKey = 'manual_error' | 'manual_success' | 'prod_error' | 'prod_success' | 'manual_crashed' | 'prod_crashed' | `${'instance_ai'}_${'mock' | 'real'}_${'manual' | 'prod'}_${'error' | 'success' | 'crashed'}`;
interface IExecutionTrackData {
    count: number;
    first: Date;
}
type IExecutionsBufferEntry = Partial<Record<ExecutionTrackDataKey, IExecutionTrackData>> & {
    user_id: string | undefined;
};
interface IExecutionsBuffer {
    [workflowId: string]: IExecutionsBufferEntry;
}
interface IApiInvocationProperties {
    user_id: string;
    path: string;
    method: string;
    api_version: string;
    user_agent?: string;
}
interface IApiInvocationsBufferEntry {
    total_calls: number;
    first: Date;
    endpoints: Record<string, number>;
    user_agents: Record<string, number>;
}
interface IApiInvocationsBuffer {
    [userId: string]: IApiInvocationsBufferEntry;
}
interface IAgentExecutionCounts {
    message_count: number;
    token_count: number;
    tool_call_count: number;
}
interface IAgentExecutionCountsBuffer {
    [bufferKey: string]: IAgentExecutionCounts & {
        agent_id: string;
        user_id?: string;
        run_type: AgentRunTelemetryType;
        first_message_at?: string;
        counts_by_source: Record<string, IAgentExecutionCounts>;
    };
}
interface IAgentSessionMetrics {
    latency_ms: number;
    cost: number;
    token_count: number;
    tool_call_count: number;
    num_skills: number;
    turn_count: number;
}
interface IAgentSessionMetricsBuffer {
    [bufferKey: string]: {
        agent_id: string;
        user_id?: string;
        agent_type: IAgentTurnFinishedTrackProperties['agent_type'];
        run_type: IAgentTurnFinishedTrackProperties['run_type'];
        turn_status: IAgentTurnFinishedTrackProperties['turn_status'];
        configuration: IAgentConfigurationTelemetryProperties;
        sessions: Record<string, IAgentSessionMetrics>;
        sessions_by_source: Record<string, Record<string, IAgentSessionMetrics>>;
    };
}
export declare class Telemetry {
    private readonly logger;
    private readonly postHog;
    private readonly license;
    private readonly instanceSettings;
    private readonly workflowRepository;
    private readonly globalConfig;
    private readonly errorReporter;
    private readonly outboundHttp;
    private rudderStack?;
    private userCloudId?;
    private executionCountsBuffer;
    private apiInvocationsBuffer;
    private agentExecutionCountsBuffer;
    private agentSessionMetricsBuffer;
    private readonly eventsMissingUserId;
    constructor(logger: Logger, postHog: PostHogClient, license: License, instanceSettings: InstanceSettings, workflowRepository: WorkflowRepository, globalConfig: GlobalConfig, errorReporter: ErrorReporter, outboundHttp: OutboundHttp);
    sanitizeTelemetryProperties(obj: Record<string, any>, depth?: number, maxDepth?: number): Record<string, string | number>;
    init(): Promise<void>;
    flushBuffers(): void;
    sendPulsePacket(): Promise<void>;
    private flushApiInvocations;
    private flushWorkflowExecutionCounts;
    private getAgentExecutionCountsBufferKey;
    private flushAgentExecutionCounts;
    private getAgentSessionMetricsBufferKey;
    private flushAgentSessionMetrics;
    private sumAgentSessionMetrics;
    trackWorkflowExecution(properties: IExecutionTrackProperties): void;
    private addExecutionTrackData;
    trackAgentExecution(properties: IAgentExecutionTrackProperties): void;
    trackAgentTurnFinished(properties: IAgentTurnFinishedTrackProperties): void;
    trackApiInvocation(properties: IApiInvocationProperties): void;
    stopTracking(): Promise<void>;
    groupIdentify({ userId, traits, postHog, }: {
        userId?: string;
        traits?: Record<string, string | number>;
        postHog?: {
            userId?: string;
            traits?: Record<string, string | number>;
        };
    }): void;
    identify(traits?: {
        [key: string]: string | number | boolean | object | undefined | null;
    }, userId?: string): void;
    setUserCloudId(userCloudId?: string): void;
    track<T extends TelemetryEventDef>(event: T, properties: InferTelemetryProps<T>): void;
    track(eventName: string, properties?: ITelemetryTrackProperties): void;
    private warnAboutMissingUserId;
    getCountsBuffer(): IExecutionsBuffer;
    getApiInvocationsBuffer(): IApiInvocationsBuffer;
    getAgentExecutionCountsBuffer(): IAgentExecutionCountsBuffer;
    getAgentSessionMetricsBuffer(): IAgentSessionMetricsBuffer;
}
export {};
