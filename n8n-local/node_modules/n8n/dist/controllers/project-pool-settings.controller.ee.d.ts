import type { ProjectPoolSettingsResponse } from '@n8n/api-types';
import { UpdateProjectPoolSettingsDto } from '@n8n/api-types';
import type { Request, Response } from 'express';
import { PoolConfigService } from '../scaling/pool-config.service.ee';
export declare class ProjectPoolSettingsController {
    private readonly poolConfigService;
    constructor(poolConfigService: PoolConfigService);
    getPoolSettings(_req: Request, _res: Response, projectId: string): Promise<ProjectPoolSettingsResponse>;
    updatePoolSettings(_req: Request, _res: Response, dto: UpdateProjectPoolSettingsDto, projectId: string): Promise<ProjectPoolSettingsResponse>;
}
