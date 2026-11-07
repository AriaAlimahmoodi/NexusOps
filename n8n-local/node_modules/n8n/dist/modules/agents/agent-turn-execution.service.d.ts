import type { Agent as RuntimeAgent, ExecutionOptions, ResumeOptions, RunOptions } from '@n8n/agents';
import type { AgentBackgroundJobSignal } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AgentChatSurface, AgentSessionMode } from './utils/agent-thread-access';
import { AgentChatExecutionService } from './agent-chat-execution.service';
import { AgentMessageQueueService } from './agent-message-queue.service';
import { AgentMessageSteeringService } from './agent-message-steering.service';
import type { AgentExecutionStreamChunk } from './types/agent-steering';
import { AgentToolApprovalService } from './agent-tool-approval.service';
import { type AgentExecutionAdmission } from './types/agent-queued-message';
import { AgentExecutionService, type RecordMessageParams, type StartExecutionParams } from './agent-execution.service';
import { ExecutionRecorder } from './execution-recorder';
import type { ToolRegistry } from './tool-registry';
type RecordingContext = Pick<StartExecutionParams, 'projectId' | 'agentId' | 'threadId'>;
export type AgentTurnRequest = {
    recording: StartExecutionParams;
} & ({
    type: 'start';
    input: Parameters<RuntimeAgent['stream']>[0];
    options: RunOptions & ExecutionOptions;
} | {
    type: 'resume';
    resumeData: unknown;
    options: ResumeOptions & ExecutionOptions;
});
interface ExecuteTurnConfig {
    admittedExecution?: AgentExecutionAdmission;
    onAdmitted?: () => Promise<void>;
    agentInstance: RuntimeAgent;
    toolRegistry: ToolRegistry;
    mcpServerAttributions: Map<string, string>;
    context: RecordingContext;
    prepare: () => Promise<AgentTurnRequest>;
    backgroundJobSignal?: AgentBackgroundJobSignal;
    chatSurface?: AgentChatSurface;
    automaticPreviewContinuation?: boolean;
    isWakeRun?: boolean;
    onExecutionStarted?: (executionId: string, sessionId: string, inputMessageIds: string[]) => void;
    onExecutionRecorded?: (executionId: string) => void;
    onSettled?: (suspended: boolean) => Promise<void>;
}
export declare class AgentTurnExecutionService {
    private readonly logger;
    private readonly agentExecutionService;
    private readonly chatExecutionService;
    private readonly messageQueue;
    private readonly steering;
    private readonly toolApprovalService;
    constructor(logger: Logger, agentExecutionService: AgentExecutionService, chatExecutionService: AgentChatExecutionService, messageQueue: AgentMessageQueueService, steering: AgentMessageSteeringService, toolApprovalService: AgentToolApprovalService);
    getSessionMode(threadId: string): Promise<AgentSessionMode>;
    execute(config: ExecuteTurnConfig): AsyncGenerator<AgentExecutionStreamChunk>;
    private createChatExecutionControl;
    private startTurn;
    private streamTurn;
    private settleTurn;
    private finalizeTurn;
    createRecorder(toolRegistry?: ToolRegistry, getExecutionId?: () => string | undefined, context?: RecordingContext, backgroundJobSignal?: AgentBackgroundJobSignal, startedAt?: Date): ExecutionRecorder;
    startExecution(params: StartExecutionParams, startedAt: Date, executionError?: unknown): Promise<AgentExecutionAdmission>;
    finalizeExecution(args: {
        executionId: string;
        executionStarted: boolean;
        executionError?: unknown;
        onExecutionRecorded?: (executionId: string) => void;
        params: RecordMessageParams;
    }): Promise<void>;
    recordFailedAdmission(admission: AgentExecutionAdmission, params: StartExecutionParams, executionError: unknown): Promise<void>;
    recordFailedStart(params: StartExecutionParams, executionError: unknown, onExecutionRecorded?: (executionId: string) => void, options?: {
        previewChat?: boolean;
        automaticContinuationRunId?: string;
    }): Promise<void>;
    private admitTurn;
    private recordTurnStart;
    private startAcceptedTurn;
    private streamStartTurnNotices;
}
export {};
