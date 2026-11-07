import type { EvaluationApiError, UpsertEvaluationConfigDto } from '@n8n/api-types';
import type { EvaluationConfig, User } from '@n8n/db';
import type { IWorkflowBase } from 'n8n-workflow';
import { CredentialsFinderService } from '@n8n/backend-services';
import { DataTableRepository } from '../modules/data-table/data-table.repository';
import { LlmJudgeProviderRegistry } from './llm-judge-provider-registry';
export interface ValidateArgs {
    workflow: IWorkflowBase;
    config: UpsertEvaluationConfigDto | EvaluationConfig;
    user: User;
}
export declare class EvaluationConfigValidator {
    private readonly dataTableRepository;
    private readonly credentialsFinder;
    private readonly providerRegistry;
    constructor(dataTableRepository: DataTableRepository, credentialsFinder: CredentialsFinderService, providerRegistry: LlmJudgeProviderRegistry);
    validate(args: ValidateArgs): Promise<EvaluationApiError[]>;
    private checkMetricInputsNonEmpty;
    private getNodeByName;
    private llmJudgeMetrics;
    private checkNodeReferences;
    private checkReservedPrefix;
    private checkEntryAmbiguity;
    private checkReachability;
    private checkMetricUniqueness;
    private checkBooleanCoercion;
    private checkDatasetSource;
    private checkDataTableAccess;
    private checkLlmJudgeProvidersAndCredentials;
}
export declare function isCoercibleBooleanExpression(expression: string): boolean;
