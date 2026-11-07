import { Logger } from '@n8n/backend-common';
import { ExternalSecretsProviders } from './external-secrets-providers.ee';
import type { SecretsProvider, SecretsProviderSettings } from './types';
interface ProviderInitResult {
    success: boolean;
    provider?: SecretsProvider;
    error?: Error;
}
export interface ProviderConnectResult {
    success: boolean;
    error?: Error;
}
export declare class ExternalSecretsProviderLifecycle {
    private readonly logger;
    private readonly providersFactory;
    constructor(logger: Logger, providersFactory: ExternalSecretsProviders);
    initialize(name: string, settings: SecretsProviderSettings): Promise<ProviderInitResult>;
    connect(provider: SecretsProvider): Promise<ProviderConnectResult>;
    disconnect(provider: SecretsProvider): Promise<void>;
    reload(provider: SecretsProvider, settings: SecretsProviderSettings): Promise<ProviderInitResult>;
}
export {};
