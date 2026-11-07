import { type AgentExecutionCounter, type BuiltTelemetry, type CredentialProvider, type DelegateSubAgentCancelRequest, type DelegateSubAgentResumeRequest, type GenerateResult, type JSONValue, type StreamChunk, type SubAgentTaskDifficulty, type SubAgentTaskPath } from '@n8n/agents';
import type { AgentBudgetNotice, SubAgentSpawnRequest } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { AiConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import type { AgentRunTelemetryType } from '../../../interfaces';
import type { IntegrationMessageContext } from '../integrations/integration-tool-types';
import { AgentTurnExecutionService } from '../agent-turn-execution.service';
import { AgentToolApprovalService } from '../agent-tool-approval.service';
import type { AgentRuntimeInstrumentation } from '../agent-runtime-instrumentation';
import type { AgentSandboxRuntime } from '../agent-sandbox-runtime.service';
import { N8NCheckpointStorage } from '../integrations/n8n-checkpoint-storage';
import type { WorkflowToolExecutionMode } from '../tools/workflow-tool-factory';
import { SubAgentSourceResolver } from './sub-agent-source-resolver';
export interface SubAgentRunContext {
    projectId: string;
    parentAgentId: string;
    credentialProvider: CredentialProvider;
    runType: AgentRunTelemetryType;
    workflowToolExecutionMode?: WorkflowToolExecutionMode;
    executionCounter?: AgentExecutionCounter;
    abortSignal?: AbortSignal;
    telemetry?: BuiltTelemetry;
    user?: User;
    instrumentation?: AgentRuntimeInstrumentation;
    parentWorkspaceHandle?: AgentSandboxRuntime;
    onChunk?: (chunk: StreamChunk) => void;
    rootSessionId?: string;
    rootSessionCapUsd?: number;
    budgetForwarded?: boolean;
    selfDelegationDifficulty?: SubAgentTaskDifficulty;
    backgroundJobId?: string;
    parentMessageContext?: IntegrationMessageContext | null;
    onResumeClaimed?: () => Promise<void>;
    beforeResume?: () => Promise<void>;
    shouldPause?: () => Promise<boolean>;
    runtimeSnapshot?: string;
    onBudgetNotice?: (notice: AgentBudgetNotice) => void;
}
export interface SubAgentRunResult {
    taskPath: SubAgentTaskPath;
    threadId: string;
    status: 'completed' | 'failed' | 'suspended' | 'paused';
    result: GenerateResult;
    resumeContext?: JSONValue;
}
type SubAgentResumeRequest = Pick<DelegateSubAgentResumeRequest, 'subAgentId' | 'childThreadId' | 'parentThreadId' | 'childRunId' | 'childToolCallId' | 'resumeData' | 'taskPath' | 'resumeContext'>;
export declare class SubAgentRunner {
    private readonly sourceResolver;
    private readonly turnExecutionService;
    private readonly checkpointStorage;
    private readonly logger;
    private readonly aiConfig;
    private readonly toolApprovalService;
    constructor(sourceResolver: SubAgentSourceResolver, turnExecutionService: AgentTurnExecutionService, checkpointStorage: N8NCheckpointStorage, logger: Logger, aiConfig: AiConfig, toolApprovalService: AgentToolApprovalService);
    run(request: SubAgentSpawnRequest, context: SubAgentRunContext): Promise<SubAgentRunResult>;
    resumeForeground(request: SubAgentResumeRequest, context: SubAgentRunContext, expectedSourceAgentId?: string): Promise<SubAgentRunResult>;
    resumePaused(request: Omit<SubAgentResumeRequest, 'childToolCallId' | 'resumeData'>, context: SubAgentRunContext): Promise<SubAgentRunResult>;
    cancelForeground(request: DelegateSubAgentCancelRequest, expectedSourceAgentId?: string): Promise<void>;
    private executeForeground;
    private resolveSandboxPrincipalHash;
}
export {};
