import type { AgentIntegrationConfig } from '@n8n/api-types';
import type { ActionEvent, Author, Thread } from 'chat';
import type { Logger } from 'n8n-workflow';
import type { ActionDecisionMessageFormatter, BridgeResumeExecutionContext, PlatformAgentContext, SettleActionMessage } from './agent-chat-integration';
import type { AgentChatMessageContextBridge } from './agent-chat-message-context';
import type { AgentChatStreamConsumer } from './agent-chat-stream-consumer';
import type { CallbackStore } from './callback-store';
import type { InternalThread } from './types';
import type { ResumeForChatConfig, AgentExecutionOrchestratorService } from '../agent-execution-orchestrator.service';
type ResumeExecutor = Pick<AgentExecutionOrchestratorService, 'resumeForChat'> & {
    isResumable?(config: {
        agentId: string;
        runId: string;
    }): Promise<boolean>;
};
interface AgentChatHitlResumeHandlerOptions {
    agentId: string;
    projectId: string;
    integration: AgentIntegrationConfig;
    agentService: ResumeExecutor;
    logger: Logger;
    callbackStore?: CallbackStore;
    deleteActionMessageBeforeResume: boolean;
    formatActionDecisionMessage?: ActionDecisionMessageFormatter;
    settleActionMessage?: SettleActionMessage;
    resolvePlatformThreadId: (thread: Thread<unknown, unknown>) => string;
    toAgentThreadId: (platformThreadId: string) => InternalThread;
    getPlatformAgentContext: () => PlatformAgentContext;
    messageContextBridge: AgentChatMessageContextBridge;
    streamConsumer: AgentChatStreamConsumer;
    createResumeExecutionContext: (thread: Thread<unknown, unknown>) => Promise<BridgeResumeExecutionContext>;
}
export declare class AgentChatHitlResumeHandler {
    private readonly options;
    private readonly activeResumedRuns;
    constructor(options: AgentChatHitlResumeHandlerOptions);
    handleAction(event: ActionEvent): Promise<void>;
    private parseActionId;
    private resolveCallbackData;
    private cleanUpBeforeResume;
    private deleteActionMessage;
    private isRunResumable;
    private getApprovalDecision;
    executeResume(thread: Thread<unknown, unknown>, runId: string, toolCallId: string, resumeData: unknown, options?: Pick<ResumeForChatConfig, 'messageContext' | 'contextConversation'> & {
        actingUser?: Author;
        cardRecipientId?: string;
    }): Promise<boolean>;
}
export {};
