import { type CredentialProvider } from '@n8n/agents';
import { type ApprovalSuspendPayload } from '@n8n/agents/tool';
import type { User } from '@n8n/db';
import { UserError } from 'n8n-workflow';
import { z } from 'zod';
import { AgentExecutionOrchestratorService, type ExecuteForChatConfig, type ResumeForChatConfig } from './agent-execution-orchestrator.service';
import { AgentExecutionService } from './agent-execution.service';
import { AgentValidationService } from './agent-validation.service';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
import type { AgentExecutionStreamChunk } from './types/agent-steering';
import type { AgentSessionMode } from './utils/agent-thread-access';
interface PrepareDraftRunInput {
    agentId: string;
    projectId: string;
    user: User;
    sessionId?: string;
    previewChat?: boolean;
    newSession?: boolean;
    credentialProvider: CredentialProvider;
}
export type PrepareDraftRunResult = {
    status: 'ready';
    sessionId: string;
    sessionMode: AgentSessionMode;
} | {
    status: 'session_not_found';
} | {
    status: 'agent_misconfigured';
    missing: string[];
};
interface DraftRunConsumptionOptions {
    errorMode?: 'throw' | 'forward';
    onChunk?: (chunk: AgentExecutionStreamChunk) => void;
}
export interface ExecutePreparedDraftRunInput extends Omit<ExecuteForChatConfig, 'memory'>, DraftRunConsumptionOptions {
    sessionId: string;
}
export interface ResumePreparedDraftRunInput extends Omit<ResumeForChatConfig, 'integrationType' | 'usePublishedVersion' | 'chatSurface'>, DraftRunConsumptionOptions {
    user: User;
    chatSurface?: 'preview';
    initialResponse?: string;
}
type ExecuteDraftRunInput = PrepareDraftRunInput & Pick<ExecuteForChatConfig, 'message' | 'user' | 'source' | 'abortSignal'>;
interface ResumeDraftRunInput extends Omit<ResumeForChatConfig, 'expectedMemory' | 'integrationType' | 'usePublishedVersion' | 'onExecutionRecorded' | 'chatSurface'> {
    sessionId: string;
    user: User;
    chatSurface?: 'preview';
    response: string;
}
export declare const agentTestRunContinuationSchema: z.ZodObject<{
    runId: z.ZodString;
    toolCallId: z.ZodString;
    sessionId: z.ZodString;
    response: z.ZodString;
}, "strict", z.ZodTypeAny, {
    runId: string;
    toolCallId: string;
    sessionId: string;
    response: string;
}, {
    runId: string;
    toolCallId: string;
    sessionId: string;
    response: string;
}>;
export type AgentTestRunContinuation = z.infer<typeof agentTestRunContinuationSchema>;
export interface AgentTestRunSuspension {
    runId: string;
    toolCallId: string;
    toolName: string;
    input?: unknown;
    suspendPayload?: unknown;
    resumeSchema?: unknown;
}
export interface AgentTestRunApproval extends ApprovalSuspendPayload {
    continuation: AgentTestRunContinuation;
}
export type PreparedDraftRunResult = {
    response: string;
    executionId: string;
    maxIterations?: true;
} & ({
    status: 'completed';
} | {
    status: 'suspended';
    suspensions: AgentTestRunSuspension[];
});
export type AgentTestRunResult = (PreparedDraftRunResult & {
    sessionId: string;
}) | Exclude<PrepareDraftRunResult, {
    status: 'ready';
}>;
export declare class InvalidAgentTestRunCheckpointError extends UserError {
    readonly code = "invalid_checkpoint";
    constructor();
}
export declare function parseStandardApprovalSuspension(suspension: AgentTestRunSuspension): ApprovalSuspendPayload | undefined;
export declare function collectStandardApprovals(result: Extract<AgentTestRunResult, {
    status: 'suspended';
}>): AgentTestRunApproval[] | undefined;
export declare class AgentTestRunService {
    private readonly agentExecutionService;
    private readonly agentValidationService;
    private readonly agentExecutionOrchestratorService;
    private readonly n8nCheckpointStorage;
    constructor(agentExecutionService: AgentExecutionService, agentValidationService: AgentValidationService, agentExecutionOrchestratorService: AgentExecutionOrchestratorService, n8nCheckpointStorage: N8NCheckpointStorage);
    prepareDraftRun({ agentId, projectId, user, sessionId, previewChat, newSession, credentialProvider, }: PrepareDraftRunInput): Promise<PrepareDraftRunResult>;
    executePreparedDraftRun({ sessionId, errorMode, onChunk, onExecutionRecorded, ...execution }: ExecutePreparedDraftRunInput): Promise<PreparedDraftRunResult>;
    resumePreparedDraftRun({ initialResponse, errorMode, onChunk, onExecutionRecorded, ...execution }: ResumePreparedDraftRunInput): Promise<PreparedDraftRunResult>;
    executeDraftRun({ credentialProvider, ...input }: ExecuteDraftRunInput): Promise<AgentTestRunResult>;
    resumeDraftRun({ sessionId, response, ...input }: ResumeDraftRunInput): Promise<AgentTestRunResult>;
    resumeDraftApproval(input: {
        agentId: string;
        projectId: string;
        continuation: unknown;
        approved: boolean;
        user: User;
        source?: string;
        abortSignal?: AbortSignal;
    }): Promise<AgentTestRunResult>;
    cancelSuspendedRuns({ agentId, suspensions, userId, }: {
        agentId: string;
        suspensions: Array<Pick<AgentTestRunSuspension, 'runId'>>;
        userId: string;
    }): Promise<boolean>;
    private collectDraftRun;
    private validateDraftApprovalCheckpoint;
    private observeDraftChunk;
    private collectDraftChunk;
}
export {};
