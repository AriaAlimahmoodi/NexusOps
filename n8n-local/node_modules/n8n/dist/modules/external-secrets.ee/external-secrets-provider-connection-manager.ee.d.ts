import { Logger } from '@n8n/backend-common';
import { ExternalSecretsProviderLifecycle } from './provider-lifecycle.service';
import { ExternalSecretsProviderRegistry } from './provider-registry.service';
import { ExternalSecretsRetryManager } from './retry-manager.service';
import { ExternalSecretsSecretsCache } from './secrets-cache.service';
import type { SecretsProviderSettings } from './types';
export interface ProviderConnectionInput {
    providerKey: string;
    providerType: string;
    config: SecretsProviderSettings;
}
export declare class ExternalSecretsProviderConnectionManager {
    private readonly logger;
    private readonly providerRegistry;
    private readonly providerLifecycle;
    private readonly retryManager;
    private readonly secretsCache;
    private readonly replacementCandidates;
    constructor(logger: Logger, providerRegistry: ExternalSecretsProviderRegistry, providerLifecycle: ExternalSecretsProviderLifecycle, retryManager: ExternalSecretsRetryManager, secretsCache: ExternalSecretsSecretsCache);
    upsertProviderConnection(input: ProviderConnectionInput): Promise<void>;
    upsertProviderConnections(inputs: ProviderConnectionInput[]): Promise<void>;
    shutdown(): void;
    private prepareProviderConnection;
    removeProviderConnection(providerKey: string): Promise<void>;
    disconnectProvider(providerKey: string): Promise<void>;
    private addProviderConnection;
    private connectAndHydrate;
    private replaceProviderConnection;
    private runIfCurrentWithRetry;
    private beginReplacement;
    private connectReplacement;
    private startReplacementHydration;
    private hydrateReplacement;
    private settleReplacement;
    private publishRetryableFailure;
    private disposeSupersededCandidate;
    private isCurrentReplacement;
    private isServingPredecessor;
    private invalidateReplacement;
}
