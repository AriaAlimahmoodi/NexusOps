import { CreateSkillDto, ListSkillsQueryDto, SaveSkillDto, SkillNewNameQueryDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import { SkillsApiService } from './skills/skills-api.service';
import { SkillsHubRollout } from './skills/skills-hub-rollout';
export declare class SkillsController {
    private readonly skillsApi;
    private readonly rollout;
    constructor(skillsApi: SkillsApiService, rollout: SkillsHubRollout);
    requireSkillsHub(_req: Request, res: Response, next: NextFunction): void;
    list(req: AuthenticatedRequest, _res: Response, query: ListSkillsQueryDto): Promise<import("@n8n/api-types").SkillListResponse>;
    newName(req: AuthenticatedRequest, _res: Response, query: SkillNewNameQueryDto): Promise<import("@n8n/api-types").SkillNewNameResponse>;
    get(req: AuthenticatedRequest, _res: Response, skillId: string): Promise<import("@n8n/api-types").SkillDetail>;
    create(req: AuthenticatedRequest, _res: Response, payload: CreateSkillDto): Promise<import("@n8n/api-types").SkillDetail>;
    update(req: AuthenticatedRequest, _res: Response, skillId: string, payload: SaveSkillDto): Promise<import("@n8n/api-types").SkillSaveResponse>;
    delete(req: AuthenticatedRequest, _res: Response, skillId: string): Promise<{
        ok: boolean;
    }>;
}
