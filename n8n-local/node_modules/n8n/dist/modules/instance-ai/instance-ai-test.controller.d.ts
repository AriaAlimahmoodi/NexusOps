import { ProjectRepository, UserRepository, WorkflowRepository } from '@n8n/db';
import type { Request, Response } from 'express';
import { InstanceAiMemoryService } from './instance-ai-memory.service';
import { InstanceAiService } from './instance-ai.service';
import { InstanceAiThreadRepository } from './repositories/instance-ai-thread.repository';
export declare class InstanceAiTestController {
    private readonly instanceAiService;
    private readonly threadRepo;
    private readonly workflowRepo;
    private readonly userRepo;
    private readonly memoryService;
    private readonly projectRepo;
    constructor(instanceAiService: InstanceAiService, threadRepo: InstanceAiThreadRepository, workflowRepo: WorkflowRepository, userRepo: UserRepository, memoryService: InstanceAiMemoryService, projectRepo: ProjectRepository);
    loadToolTrace(req: Request): {
        ok: boolean;
        count: number;
    };
    getToolTrace(_req: Request, _res: Response, slug: string): {
        events: unknown[];
    };
    getIdleState(): {
        idle: boolean;
    };
    startBackgroundTimeoutSimulation(payload: {
        userId: string;
        threadId?: string;
    }): Promise<{
        threadId: string;
        runId: string;
        messageGroupId: string;
        taskId: string;
        agentId: string;
        timeoutAt: number;
    }>;
    runLivenessSweep(payload?: {
        now?: number;
    }): Promise<{
        ok: boolean;
    }>;
    clearToolTrace(_req: Request, _res: Response, slug: string): {
        ok: boolean;
    };
    reset(): Promise<{
        ok: boolean;
        threadsDeleted: number;
        workflowsDeleted: number;
    }>;
    private assertTraceReplayEnabled;
}
