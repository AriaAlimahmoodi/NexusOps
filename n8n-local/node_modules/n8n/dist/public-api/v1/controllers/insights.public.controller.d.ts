import { InsightsSummaryPublicDto, InsightsSummaryQueryPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { InsightsService } from '@n8n/backend-module-insights';
export declare class InsightsPublicController {
    private readonly insightsService;
    constructor(insightsService: InsightsService);
    getInsightsSummary(req: AuthenticatedRequest, _res: Response, query: InsightsSummaryQueryPublicDto): Promise<InsightsSummaryPublicDto>;
}
