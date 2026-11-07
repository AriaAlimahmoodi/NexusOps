import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { SecretsProviderConnectionRepository } from '@n8n/db';
import { Cipher, type IExternalSecretsManager } from 'n8n-core';
import { type IDataObject, type INodeProperties } from 'n8n-workflow';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { ExternalSecretsProviderConnectionManager } from './external-secrets-provider-connection-manager.ee';
import { ExternalSecretsProviders } from './external-secrets-providers.ee';
import { ExternalSecretsConfig } from './external-secrets.config';
import { ExternalSecretsProviderLifecycle } from './provider-lifecycle.service';
import { ExternalSecretsProviderRegistry } from './provider-registry.service';
import { ExternalSecretsSecretsCache } from './secrets-cache.service';
import { ExternalSecretsSettingsStore } from './settings-store.service';
import type { SecretsProvider, SecretsProviderSettings } from './types';
export declare class ExternalSecretsManager implements IExternalSecretsManager {
    private readonly logger;
    private readonly config;
    private readonly providersFactory;
    private readonly eventService;
    private readonly publisher;
    private readonly settingsStore;
    private readonly providerRegistry;
    private readonly providerLifecycle;
    private readonly providerConnectionManager;
    private readonly secretsCache;
    private readonly secretsProviderConnectionRepository;
    private readonly cipher;
    initialized: boolean;
    private initializingPromise?;
    constructor(logger: Logger, config: ExternalSecretsConfig, providersFactory: ExternalSecretsProviders, eventService: EventService, publisher: Publisher, settingsStore: ExternalSecretsSettingsStore, providerRegistry: ExternalSecretsProviderRegistry, providerLifecycle: ExternalSecretsProviderLifecycle, providerConnectionManager: ExternalSecretsProviderConnectionManager, secretsCache: ExternalSecretsSecretsCache, secretsProviderConnectionRepository: SecretsProviderConnectionRepository, cipher: Cipher);
    init(): Promise<void>;
    shutdown(): void;
    getProvider(provider: string): SecretsProvider | undefined;
    getProviderProperties(providerType: string): INodeProperties[];
    hasProvider(provider: string): boolean;
    getProviderNames(): string[];
    getProvidersWithSettings(): Array<{
        provider: SecretsProvider;
        settings: SecretsProviderSettings;
    }>;
    getProviderWithSettings(provider: string): {
        provider: SecretsProvider;
        settings: SecretsProviderSettings;
    };
    syncProviderConnection(providerKey: string): Promise<void>;
    updateProvider(providerKey: string): Promise<void>;
    getSecret(provider: string, name: string): unknown;
    hasSecret(provider: string, name: string): boolean;
    getSecretNames(provider: string): string[];
    getAllSecretNames(): Record<string, string[]>;
    setProviderSettings(provider: string, settings: IDataObject, userId?: string): Promise<void>;
    setProviderConnected(provider: string, connected: boolean): Promise<void>;
    testProviderSettings(provider: string, data: IDataObject): Promise<{
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
    reloadAllProviders(): Promise<void>;
    private reloadProvidersFromConnectionsRepo;
    private reloadProvider;
    private decryptSettings;
    updateSecrets(signal: AbortSignal): Promise<void>;
    private broadcastReload;
    private trackProviderSave;
    private getCachedSettings;
}
