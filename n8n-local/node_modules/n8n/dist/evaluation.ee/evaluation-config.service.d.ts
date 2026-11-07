import type { UpsertEvaluationConfigDto } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import type { EvaluationConfig, User, WorkflowEntity } from '@n8n/db';
import { EvaluationConfigRepository } from '@n8n/db';
import { EvaluationConfigValidator } from './evaluation-config-validator';
export declare class EvaluationConfigService {
    private readonly repository;
    private readonly validator;
    private readonly licenseState;
    constructor(repository: EvaluationConfigRepository, validator: EvaluationConfigValidator, licenseState: LicenseState);
    list(workflowId: string): Promise<EvaluationConfig[]>;
    get(workflowId: string, configId: string): Promise<EvaluationConfig | null>;
    create(workflowId: string, workflow: WorkflowEntity, user: User, dto: UpsertEvaluationConfigDto): Promise<EvaluationConfig>;
    update(workflowId: string, configId: string, workflow: WorkflowEntity, user: User, dto: UpsertEvaluationConfigDto): Promise<EvaluationConfig>;
    delete(workflowId: string, configId: string): Promise<void>;
    markInvalid(configId: string, reason: string): Promise<void>;
    private runValidator;
}
