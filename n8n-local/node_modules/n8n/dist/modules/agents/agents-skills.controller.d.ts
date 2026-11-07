import { CreateAgentSkillDto, UpdateAttachedAgentSkillDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentSkillsService } from './agent-skills.service';
import { CollaborationService } from '../../collaboration/collaboration.service';
export declare class AgentsSkillsController {
    private readonly agentSkillsService;
    private readonly collaborationService;
    constructor(agentSkillsService: AgentSkillsService, collaborationService: CollaborationService);
    listSkills(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>): Promise<Record<string, import("@n8n/api-types").AgentSkill>>;
    getSkill(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        skillId: string;
    }>, _res: Response, agentId: string, skillId: string): Promise<import("@n8n/api-types").AgentSkill>;
    createSkill(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>, _res: Response, agentId: string, payload: CreateAgentSkillDto): Promise<import("@n8n/api-types").AgentSkillMutationResponse>;
    updateSkill(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        skillId: string;
    }>, _res: Response, agentId: string, skillId: string, payload: UpdateAttachedAgentSkillDto): Promise<import("@n8n/api-types").AgentSkillMutationResponse>;
    deleteSkill(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        skillId: string;
    }>, _res: Response, agentId: string, skillId: string): Promise<{
        ok: boolean;
    }>;
}
