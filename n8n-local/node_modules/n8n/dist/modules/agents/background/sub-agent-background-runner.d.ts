import type { SubAgentSource, SubAgentTaskDifficulty } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { AgentBackgroundJobService, type BackgroundJobReceipt } from './agent-background-job.service';
import { AgentBackgroundJobRepository } from '../repositories/agent-background-job.repository';
import { AgentWorkspaceService } from '../agent-workspace.service';
import type { AgentBackgroundJob } from '../entities/agent-background-job.entity';
import type { IntegrationMessageContext } from '../integrations/integration-tool-types';
import { SubAgentRunner, type SubAgentRunContext } from '../sub-agents/sub-agent-runner';
export type BackgroundSubAgentRunContext = Pick<SubAgentRunContext, 'credentialProvider' | 'runType' | 'workflowToolExecutionMode' | 'user' | 'instrumentation' | 'parentWorkspaceHandle' | 'rootSessionCapUsd'>;
export interface BackgroundSpawnRequest {
    subAgentId: string;
    source: SubAgentSource;
    taskName: string;
    goal: string;
    context?: string;
    expectedOutput?: string;
    difficulty?: SubAgentTaskDifficulty;
    parentThreadId: string;
    parentResourceId: string;
    parentSandboxPrincipalHash: string;
    parentMessageContext?: IntegrationMessageContext | null;
}
export declare class SubAgentBackgroundRunner {
    private readonly runner;
    private readonly jobService;
    private readonly logger;
    private readonly jobRepository;
    private readonly workspaceService;
    private dispatchCounter;
    constructor(runner: SubAgentRunner, jobService: AgentBackgroundJobService, logger: Logger, jobRepository: AgentBackgroundJobRepository, workspaceService: AgentWorkspaceService);
    spawn(request: BackgroundSpawnRequest, context: {
        projectId: string;
        parentAgentId: string;
    } & BackgroundSubAgentRunContext): Promise<BackgroundJobReceipt>;
    resume(job: AgentBackgroundJob, response: {
        token: string;
        resumeData: unknown;
    }, context: {
        projectId: string;
        parentAgentId: string;
    } & BackgroundSubAgentRunContext): Promise<void>;
    resumePaused(job: AgentBackgroundJob, context: {
        projectId: string;
        parentAgentId: string;
    } & BackgroundSubAgentRunContext, reservationTimeoutAt: Date): Promise<void>;
    private dispatch;
}
