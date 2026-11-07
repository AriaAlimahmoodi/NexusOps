import { type AgentCapabilitySummary, CreateAgentDto, ListAgentsQueryDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { CollaborationService } from '../../collaboration/collaboration.service';
import { AgentRunnableStateService } from './agent-runnable-state.service';
import { AgentDefaultModelResolverService } from './agent-default-model-resolver.service';
import { AgentsService } from './agents.service';
export declare class AgentsController {
    private readonly agentsService;
    private readonly agentRunnableStateService;
    private readonly agentDefaultModelResolverService;
    private readonly collaborationService;
    constructor(agentsService: AgentsService, agentRunnableStateService: AgentRunnableStateService, agentDefaultModelResolverService: AgentDefaultModelResolverService, collaborationService: CollaborationService);
    create(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, payload: CreateAgentDto): Promise<import("./entities/agent.entity").Agent & {
        isRunnable: boolean;
        hasPublishHistory: boolean;
        configHash: string | null;
        skills: Record<string, import("@n8n/api-types").AgentSkill>;
        skillHashes: Record<string, string>;
        outdatedSkillIds: string[];
    }>;
    list(req: AuthenticatedRequest<{
        projectId: string;
    }, unknown, unknown, {
        filter?: string;
        skip?: string;
        take?: string;
        sortBy?: string;
    }>, res: Response, query: ListAgentsQueryDto): Promise<void>;
    get(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<import("./entities/agent.entity").Agent & {
        isRunnable: boolean;
        hasPublishHistory: boolean;
        configHash: string | null;
        skills: Record<string, import("@n8n/api-types").AgentSkill>;
        skillHashes: Record<string, string>;
        outdatedSkillIds: string[];
    }>;
    getSummary(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>): Promise<AgentCapabilitySummary>;
    delete(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<{
        success: boolean;
    }>;
    getWriteLock(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>, _res: Response, agentId: string): Promise<{
        clientId: string;
        userId: string;
    } | null>;
}
