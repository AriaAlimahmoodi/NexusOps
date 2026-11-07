import { CreateSecretsProviderConnectionDto, UpdateSecretsProviderConnectionDto, type SecretProviderConnectionListItem, type SecretProviderConnection, type ReloadSecretProviderConnectionResponse, type TestSecretProviderConnectionResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import { ExternalSecretsConfig } from './external-secrets.config';
import { SecretsProvidersConnectionsService } from './secrets-providers-connections.service.ee';
export declare class SecretProvidersConnectionsController {
    private readonly config;
    private readonly logger;
    private readonly connectionsService;
    constructor(config: ExternalSecretsConfig, logger: Logger, connectionsService: SecretsProvidersConnectionsService);
    checkFeatureFlag(req: Request, res: Response, next: NextFunction): void;
    createConnection(req: AuthenticatedRequest, _res: Response, body: CreateSecretsProviderConnectionDto): Promise<SecretProviderConnection>;
    updateConnection(req: AuthenticatedRequest, _res: Response, providerKey: string, body: UpdateSecretsProviderConnectionDto): Promise<SecretProviderConnection>;
    deleteConnection(req: AuthenticatedRequest, res: Response, providerKey: string): Promise<void>;
    listConnections(): Promise<SecretProviderConnectionListItem[]>;
    getConnection(_req: AuthenticatedRequest, _res: Response, providerKey: string): Promise<SecretProviderConnection>;
    testConnection(req: AuthenticatedRequest, _res: Response, providerKey: string): Promise<TestSecretProviderConnectionResponse>;
    reloadConnectionSecrets(req: AuthenticatedRequest, _res: Response, providerKey: string): Promise<ReloadSecretProviderConnectionResponse>;
}
