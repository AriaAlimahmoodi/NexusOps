import { Logger } from '@n8n/backend-common';
import { ExternalSecretsConfig } from './external-secrets.config';
import { ExternalSecretsProviderRegistry } from './provider-registry.service';
import type { SecretsProvider } from './types';
type RefreshOutcome = 'refreshed' | 'not-connected' | 'failed';
export declare class ExternalSecretsSecretsCache {
    private readonly logger;
    private readonly registry;
    private readonly config;
    private readonly inFlight;
    constructor(logger: Logger, registry: ExternalSecretsProviderRegistry, config: ExternalSecretsConfig);
    refreshAll(signal: AbortSignal): Promise<void>;
    refreshProvider(name: string, provider: SecretsProvider): Promise<RefreshOutcome>;
    updateProvider(name: string, provider: SecretsProvider): Promise<void>;
    getSecret(providerName: string, secretName: string): unknown;
    hasSecret(providerName: string, secretName: string): boolean;
    getSecretNames(providerName: string): string[];
    getAllSecretNames(): Record<string, string[]>;
}
export {};
