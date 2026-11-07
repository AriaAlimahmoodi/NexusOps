import type { ModelConfig } from '@n8n/agents';
import type { EvaluationConfig, User } from '@n8n/db';
import { EvaluationConfigRepository } from '@n8n/db';
import { CredentialsFinderService } from '@n8n/backend-services';
import { CredentialsService } from '../../credentials/credentials.service';
export type ResolvedInsightsModel = {
    modelConfig: ModelConfig;
    modelId: string;
};
export declare class InsightsModelResolver {
    private readonly evalConfigRepo;
    private readonly credentialsFinder;
    private readonly credentialsService;
    constructor(evalConfigRepo: EvaluationConfigRepository, credentialsFinder: CredentialsFinderService, credentialsService: CredentialsService);
    resolve(user: User, workflowId: string, evaluationConfigId: string, preloadedConfig?: EvaluationConfig | null): Promise<ResolvedInsightsModel | null>;
}
