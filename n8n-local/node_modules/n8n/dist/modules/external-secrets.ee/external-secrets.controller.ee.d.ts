import { Logger } from '@n8n/backend-common';
import { Request, Response, NextFunction } from 'express';
import { ExternalSecretsProviders } from './external-secrets-providers.ee';
import { ExternalSecretsService } from './external-secrets.service.ee';
import { ExternalSecretsRequest } from './types';
export declare class ExternalSecretsController {
    private readonly secretsService;
    private readonly secretsProviders;
    private readonly logger;
    constructor(secretsService: ExternalSecretsService, secretsProviders: ExternalSecretsProviders, logger: Logger);
    validateProviderName(req: Request, _: Response, next: NextFunction): void;
    getProviders(): Promise<{
        displayName: string;
        name: string;
        icon: string;
        state: import("./types").SecretsProviderState;
        connected: boolean;
        connectedAt: Date | null;
        data: import("n8n-workflow").IDataObject;
    }[]>;
    getProvider(req: ExternalSecretsRequest.GetProvider): Promise<ExternalSecretsRequest.GetProviderResponse | null>;
    testProviderSettings(req: ExternalSecretsRequest.TestProviderSettings, res: Response): Promise<{
        readonly success: false;
        readonly testState: 'error';
    } | {
        success: boolean;
        testState: string;
        error: string | undefined;
    } | {
        error?: undefined;
        success: boolean;
        testState: "connected" | "tested";
    }>;
    setProviderSettings(req: ExternalSecretsRequest.SetProviderSettings): Promise<{}>;
    setProviderConnected(req: ExternalSecretsRequest.SetProviderConnected): Promise<{}>;
    updateProvider(req: ExternalSecretsRequest.UpdateProvider, res: Response): Promise<{
        updated: boolean;
    }>;
    getSecretNames(): Record<string, string[]>;
}
