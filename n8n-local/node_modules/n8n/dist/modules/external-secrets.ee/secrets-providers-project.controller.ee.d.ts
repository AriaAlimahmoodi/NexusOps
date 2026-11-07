import { CreateSecretsProviderConnectionDto, UpdateSecretsProviderConnectionDto, type SecretProviderConnection, type SecretProviderConnectionListItem, type TestSecretProviderConnectionResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import { ExternalSecretsConfig } from './external-secrets.config';
import { SecretsProviderAccessCheckService } from './secret-provider-access-check.service.ee';
import { SecretsProvidersConnectionsService } from './secrets-providers-connections.service.ee';
export declare class SecretProvidersProjectController {
    private readonly config;
    private readonly logger;
    private readonly connectionsService;
    private readonly accessCheckService;
    constructor(config: ExternalSecretsConfig, logger: Logger, connectionsService: SecretsProvidersConnectionsService, accessCheckService: SecretsProviderAccessCheckService);
    checkFeatureFlag(_req: Request, res: Response, next: NextFunction): void;
    createConnection(req: AuthenticatedRequest, _res: Response, projectId: string, body: CreateSecretsProviderConnectionDto): Promise<SecretProviderConnection>;
    listConnectionsForAProject(_req: AuthenticatedRequest, _res: Response, projectId: string): Promise<SecretProviderConnectionListItem[]>;
    getConnection(req: AuthenticatedRequest, _res: Response, projectId: string, providerKey: string): Promise<SecretProviderConnection>;
    updateConnection(req: AuthenticatedRequest, _res: Response, projectId: string, providerKey: string, body: UpdateSecretsProviderConnectionDto): Promise<SecretProviderConnection>;
    deleteConnection(req: AuthenticatedRequest, res: Response, projectId: string, providerKey: string): Promise<void>;
    testConnection(req: AuthenticatedRequest, _res: Response, projectId: string, providerKey: string): Promise<TestSecretProviderConnectionResponse>;
}
