import { type AgentBackgroundJobsResponse, AgentChatMessageDto, AgentChatQueueUpdateDto, AgentChatQueueSteerDto, AgentChatQueueReorderDto, type AgentChatMessagesResponse, type AgentChatQueueResponse, AgentChatResumeDto } from '@n8n/api-types';
import { AgentsConfig } from '@n8n/config';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { CredentialsService } from '../../credentials/credentials.service';
import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import { AgentChatRelayService } from './agent-chat-relay.service';
import { AgentExecutionOrchestratorService } from './agent-execution-orchestrator.service';
import { AgentMessageQueueService } from './agent-message-queue.service';
import { AgentChatExecutionService } from './agent-chat-execution.service';
import { AgentExecutionService } from './agent-execution.service';
import { type FlushableResponse } from './agent-sse-stream';
import { AgentTestChatService } from './agent-test-chat.service';
import { AgentTestRunService } from './agent-test-run.service';
import { AgentsService } from './agents.service';
import { AgentBackgroundJobService } from './background/agent-background-job.service';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
export declare class AgentChatController {
    private readonly agentExecutionOrchestratorService;
    private readonly agentTestRunService;
    private readonly agentTestChatService;
    private readonly checkpointStorage;
    private readonly credentialsService;
    private readonly agentsService;
    private readonly agentChatAttachmentService;
    private readonly agentExecutionService;
    private readonly backgroundJobService;
    private readonly chatExecutionService;
    private readonly messageQueue;
    private readonly agentsConfig;
    private readonly chatRelay;
    constructor(agentExecutionOrchestratorService: AgentExecutionOrchestratorService, agentTestRunService: AgentTestRunService, agentTestChatService: AgentTestChatService, checkpointStorage: N8NCheckpointStorage, credentialsService: CredentialsService, agentsService: AgentsService, agentChatAttachmentService: AgentChatAttachmentService, agentExecutionService: AgentExecutionService, backgroundJobService: AgentBackgroundJobService, chatExecutionService: AgentChatExecutionService, messageQueue: AgentMessageQueueService, agentsConfig: AgentsConfig, chatRelay: AgentChatRelayService);
    private requireProductionChat;
    private requireProductionThread;
    private requirePreviewThread;
    private assertQueueId;
    productionChat(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: FlushableResponse, agentId: string, payload: AgentChatMessageDto): Promise<void>;
    productionChatResume(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: FlushableResponse, agentId: string, payload: AgentChatResumeDto): Promise<void>;
    chat(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: FlushableResponse, agentId: string, payload: AgentChatMessageDto): Promise<void>;
    chatResume(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: FlushableResponse, agentId: string, payload: AgentChatResumeDto): Promise<void>;
    cancelChatExecution(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, threadId: string, executionId: string): Promise<{
        cancelRequested: boolean;
    }>;
    cancelChatRun(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, runId: string): Promise<{
        cancelled: boolean;
    }>;
    cancelProductionChatExecution(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, threadId: string, executionId: string): Promise<{
        cancelRequested: boolean;
    }>;
    cancelProductionChatRun(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, runId: string): Promise<{
        cancelled: boolean;
    }>;
    getProductionChatMessages(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentChatMessagesResponse>;
    getProductionChatAttachment(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        attachmentId: string;
    }>, res: Response): Promise<void>;
    getProductionQueuedMessages(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentChatQueueResponse>;
    updateProductionQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>, _res: Response, payload: AgentChatQueueUpdateDto): Promise<void>;
    reorderProductionQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>, _res: Response, payload: AgentChatQueueReorderDto): Promise<void>;
    steerProductionQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>, _res: Response, payload: AgentChatQueueSteerDto): Promise<void>;
    removeProductionQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>): Promise<{
        removed: boolean;
    }>;
    getProductionBackgroundJobs(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentBackgroundJobsResponse>;
    stopProductionBackgroundJobs(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentBackgroundJobsResponse>;
    resumeProductionBackgroundJob(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>, _res: Response, payload: AgentChatResumeDto): Promise<{
        resumed: true;
    }>;
    deleteProductionChatThread(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, threadId: string): Promise<{
        success: boolean;
    }>;
    getQueuedMessages(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentChatQueueResponse>;
    updateQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>, _res: Response, payload: AgentChatQueueUpdateDto): Promise<void>;
    reorderQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>, _res: Response, payload: AgentChatQueueReorderDto): Promise<void>;
    removeQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>): Promise<{
        removed: boolean;
    }>;
    steerQueuedMessage(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
        queueId: string;
    }>, _res: Response, payload: AgentChatQueueSteerDto): Promise<void>;
    getBackgroundJobs(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentBackgroundJobsResponse>;
    private mapBackgroundJobsToDto;
    stopBackgroundJobs(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentBackgroundJobsResponse>;
    resumeBackgroundJob(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>, _res: Response, payload: AgentChatResumeDto): Promise<{
        resumed: true;
    }>;
    getChatMessages(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<AgentChatMessagesResponse>;
    getTestChatMessages(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>): Promise<AgentChatMessagesResponse>;
    getChatAttachment(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        attachmentId: string;
    }>, res: Response): Promise<void>;
    clearTestChatMessages(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>): Promise<{
        ok: boolean;
    }>;
}
