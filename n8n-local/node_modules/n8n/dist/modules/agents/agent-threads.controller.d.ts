import { ListAgentSessionsQueryDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentExecutionService } from './agent-execution.service';
import { AgentSessionLangSmithExportService } from './agent-session-langsmith-export.service';
export declare class AgentThreadsController {
    private readonly agentExecutionService;
    private readonly langsmithExportService;
    constructor(agentExecutionService: AgentExecutionService, langsmithExportService: AgentSessionLangSmithExportService);
    listThreads(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>, _res: Response, query: ListAgentSessionsQueryDto): Promise<{
        threads: import("./agent-execution.service").ThreadListItem[];
        nextCursor: string | null;
    }>;
    getThread(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<{
        executions: import("./entities/agent-execution.entity").AgentExecution[];
        thread: {
            canContinueInPreview: boolean;
            id: string;
            generateId(): void;
            createdAt: Date;
            updatedAt: Date;
            setUpdateDate(): void;
            agent: import("./entities/agent.entity").Agent;
            agentId: string;
            agentName: string;
            title: string | null;
            emoji: string | null;
            parentThreadId: string | null;
            parentAgentId: string | null;
            project: import("@n8n/db").Project;
            projectId: string;
            taskId: string | null;
            taskVersion: import("./entities/agent-history.entity").AgentHistory | null;
            taskVersionId: string | null;
            sessionNumber: number;
            totalPromptTokens: number;
            totalCompletionTokens: number;
            totalCost: number;
            totalDuration: number;
            source: string | null;
        };
    }>;
    exportThreadToLangSmith(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<import("@n8n/api-types").AgentSessionLangSmithExportResponse>;
    deleteThread(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        threadId: string;
    }>): Promise<{
        success: boolean;
    }>;
}
