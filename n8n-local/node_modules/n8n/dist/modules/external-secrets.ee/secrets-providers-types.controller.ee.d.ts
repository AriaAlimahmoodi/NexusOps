import type { SecretProviderTypeResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, Request, Response } from 'express';
import { ExternalSecretsProviders } from './external-secrets-providers.ee';
import { ExternalSecretsConfig } from './external-secrets.config';
export declare class SecretProvidersTypesController {
    private readonly config;
    private readonly logger;
    private readonly secretsProviders;
    constructor(config: ExternalSecretsConfig, logger: Logger, secretsProviders: ExternalSecretsProviders);
    checkFeatureFlag(_req: Request, res: Response, next: NextFunction): void;
    listSecretProviderTypes(): SecretProviderTypeResponse[];
    getSecretProviderType(_req: AuthenticatedRequest, _res: Response, type: string): SecretProviderTypeResponse;
}
