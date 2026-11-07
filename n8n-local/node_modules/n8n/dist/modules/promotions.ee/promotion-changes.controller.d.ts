import { PromotionChangesQueryDto, type PromotionChanges } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { PromotionChangeService } from './promotion-change.service';
export declare class PromotionChangesController {
    private readonly changeService;
    constructor(changeService: PromotionChangeService);
    getChanges(req: AuthenticatedRequest, _res: Response, projectId: string, direction: string, query: PromotionChangesQueryDto): Promise<PromotionChanges>;
}
