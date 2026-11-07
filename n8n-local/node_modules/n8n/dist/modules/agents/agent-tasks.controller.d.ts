import { CreateAgentTaskDto, type AgentTaskDto, UpdateAgentTaskDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { CollaborationService } from '../../collaboration/collaboration.service';
import { AgentTaskService } from './agent-task.service';
import { AgentRepository } from './repositories/agent.repository';
export declare class AgentTasksController {
    private readonly agentTaskService;
    private readonly agentRepository;
    private readonly collaborationService;
    constructor(agentTaskService: AgentTaskService, agentRepository: AgentRepository, collaborationService: CollaborationService);
    listTasks(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<AgentTaskDto[]>;
    createTask(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: CreateAgentTaskDto): Promise<AgentTaskDto>;
    updateTask(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, taskId: string, payload: UpdateAgentTaskDto): Promise<AgentTaskDto>;
    deleteTask(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, taskId: string): Promise<{
        success: true;
    }>;
    runTaskNow(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, taskId: string): Promise<{
        success: true;
    }>;
}
