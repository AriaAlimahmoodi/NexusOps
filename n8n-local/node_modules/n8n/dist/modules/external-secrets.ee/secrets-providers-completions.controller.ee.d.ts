import type { SecretCompletionsResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import { ExternalSecretsConfig } from './external-secrets.config';
import { SecretsProvidersConnectionsService } from './secrets-providers-connections.service.ee';
export declare class SecretProvidersCompletionsController {
    private readonly config;
    private readonly logger;
    private readonly connectionsService;
    constructor(config: ExternalSecretsConfig, logger: Logger, connectionsService: SecretsProvidersConnectionsService);
    checkFeatureFlag(req: Request, res: Response, next: NextFunction): void;
    listGlobalSecrets(): Promise<SecretCompletionsResponse>;
    listGlobalSecretsForProject(_req: AuthenticatedRequest, _res: Response, projectId: string): Promise<SecretCompletionsResponse>;
    listProjectSecrets(_req: AuthenticatedRequest, _res: Response, projectId: string): Promise<SecretCompletionsResponse>;
}
