import { type AgentVersionListItemDto, PaginationDto, PublishAgentDto, RevertAgentToVersionDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentPublishService } from './agent-publish.service';
import { AgentRunnableStateService } from './agent-runnable-state.service';
import { CollaborationService } from '../../collaboration/collaboration.service';
export declare class AgentPublishController {
    private readonly agentPublishService;
    private readonly agentRunnableStateService;
    private readonly collaborationService;
    constructor(agentPublishService: AgentPublishService, agentRunnableStateService: AgentRunnableStateService, collaborationService: CollaborationService);
    publish(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: PublishAgentDto): Promise<import("./entities/agent.entity").Agent & {
        isRunnable: boolean;
        hasPublishHistory: boolean;
        configHash: string | null;
        skills: Record<string, import("@n8n/api-types").AgentSkill>;
        skillHashes: Record<string, string>;
        outdatedSkillIds: string[];
    }>;
    unpublish(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<import("./entities/agent.entity").Agent & {
        isRunnable: boolean;
        hasPublishHistory: boolean;
        configHash: string | null;
        skills: Record<string, import("@n8n/api-types").AgentSkill>;
        skillHashes: Record<string, string>;
        outdatedSkillIds: string[];
    }>;
    revertToPublished(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<import("./entities/agent.entity").Agent & {
        isRunnable: boolean;
        hasPublishHistory: boolean;
        configHash: string | null;
        skills: Record<string, import("@n8n/api-types").AgentSkill>;
        skillHashes: Record<string, string>;
        outdatedSkillIds: string[];
    }>;
    revertToVersion(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: RevertAgentToVersionDto): Promise<import("./entities/agent.entity").Agent & {
        isRunnable: boolean;
        hasPublishHistory: boolean;
        configHash: string | null;
        skills: Record<string, import("@n8n/api-types").AgentSkill>;
        skillHashes: Record<string, string>;
        outdatedSkillIds: string[];
    }>;
    listVersions(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>, _res: Response, agentId: string, query: PaginationDto): Promise<AgentVersionListItemDto[]>;
}
