import type { AiInsightsResponse } from '@n8n/api-types';
import { LicenseState, Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { EvaluationCollectionRepository, EvaluationConfigRepository } from '@n8n/db';
import { Telemetry } from '../../telemetry';
import { InsightsContextBuilder } from './insights-context-builder';
import { InsightsModelResolver } from './insights-model-resolver';
export declare const DETERMINISTIC_MODEL_TAG = "deterministic";
export declare class EvalInsightsService {
    private readonly collectionRepo;
    private readonly evalConfigRepo;
    private readonly licenseState;
    private readonly telemetry;
    private readonly logger;
    private readonly modelResolver;
    private readonly contextBuilder;
    constructor(collectionRepo: EvaluationCollectionRepository, evalConfigRepo: EvaluationConfigRepository, licenseState: LicenseState, telemetry: Telemetry, logger: Logger, modelResolver: InsightsModelResolver, contextBuilder: InsightsContextBuilder);
    generateInsights(user: User, workflowId: string, collectionId: string, options?: {
        forceRegenerate?: boolean;
    }): Promise<AiInsightsResponse>;
    private summariseRun;
    private pickWinner;
    private invokeAgent;
    private reconcile;
    private generateValidated;
    private buildUserPrompt;
    private buildDeterministicInsights;
    private collectRegressions;
    private composeSuggestedNext;
    private formatScore;
}
