import { GenerateInsightsDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import { PostHogClient } from '../../posthog';
import { EvalInsightsService } from './eval-insights.service';
type CollectionParam = {
    workflowId: string;
    collectionId: string;
};
export declare class EvalInsightsController {
    private readonly service;
    private readonly postHogClient;
    private readonly logger;
    constructor(service: EvalInsightsService, postHogClient: PostHogClient, logger: Logger);
    private assertFlagEnabled;
    generate(req: AuthenticatedRequest<CollectionParam>, _res: unknown, payload: GenerateInsightsDto): Promise<{
        generatedAt: string;
        modelUsed: string;
        status: "error" | "fallback" | "ok";
        insights: {
            winner: {
                versionLabel: string;
                headline: string;
                body: string;
            };
            regressions: {
                versionLabel: string;
                metric: string;
                delta: number;
                headline: string;
                body: string;
            }[];
            suggestedNext: {
                headline: string;
                body: string;
                hypothesis: string;
            };
        };
    }>;
}
export {};
