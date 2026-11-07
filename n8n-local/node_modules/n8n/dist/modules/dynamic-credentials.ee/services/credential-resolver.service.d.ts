import { Logger } from '@n8n/backend-common';
import { User, WorkflowRepository } from '@n8n/db';
import { CredentialResolverConfiguration, ICredentialResolver } from '@n8n/decorators';
import { Cipher } from 'n8n-core';
import { ActiveWorkflowManager } from '../../../active-workflow-manager';
import { DynamicCredentialResolverRegistry } from './credential-resolver-registry.service';
import { ResolverConfigExpressionService } from './resolver-config-expression.service';
import { DynamicCredentialResolver } from '../database/entities/credential-resolver';
import { DynamicCredentialResolverRepository } from '../database/repositories/credential-resolver.repository';
export interface CreateResolverParams {
    name: string;
    type: string;
    config: CredentialResolverConfiguration;
    user: User;
}
export interface UpdateResolverParams {
    name?: string;
    type?: string;
    config?: CredentialResolverConfiguration;
    clearCredentials?: boolean;
    user: User;
}
export declare class DynamicCredentialResolverService {
    private readonly logger;
    private readonly repository;
    private readonly registry;
    private readonly cipher;
    private readonly expressionService;
    private readonly workflowRepository;
    private readonly activeWorkflowManager;
    constructor(logger: Logger, repository: DynamicCredentialResolverRepository, registry: DynamicCredentialResolverRegistry, cipher: Cipher, expressionService: ResolverConfigExpressionService, workflowRepository: WorkflowRepository, activeWorkflowManager: ActiveWorkflowManager);
    create(params: CreateResolverParams): Promise<DynamicCredentialResolver>;
    findAll(): Promise<DynamicCredentialResolver[]>;
    findAllPublic(): Promise<DynamicCredentialResolver[]>;
    getAvailableTypes(): ICredentialResolver[];
    getAvailablePublicTypes(): ICredentialResolver[];
    findById(id: string): Promise<DynamicCredentialResolver>;
    update(id: string, params: UpdateResolverParams): Promise<DynamicCredentialResolver>;
    findAffectedWorkflows(id: string): Promise<Array<{
        id: string;
        name: string;
    }>>;
    delete(id: string): Promise<void>;
    private validateConfig;
    private restoreRedactedSecrets;
    private encryptConfig;
    private decryptConfig;
    private withDecryptedConfig;
}
