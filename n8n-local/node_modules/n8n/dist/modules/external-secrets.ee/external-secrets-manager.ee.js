"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalSecretsManager = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const external_secrets_provider_connection_manager_ee_1 = require("./external-secrets-provider-connection-manager.ee");
const external_secrets_providers_ee_1 = require("./external-secrets-providers.ee");
const external_secrets_config_1 = require("./external-secrets.config");
const provider_lifecycle_service_1 = require("./provider-lifecycle.service");
const provider_registry_service_1 = require("./provider-registry.service");
const secrets_cache_service_1 = require("./secrets-cache.service");
const settings_store_service_1 = require("./settings-store.service");
let ExternalSecretsManager = class ExternalSecretsManager {
    constructor(logger, config, providersFactory, eventService, publisher, settingsStore, providerRegistry, providerLifecycle, providerConnectionManager, secretsCache, secretsProviderConnectionRepository, cipher) {
        this.logger = logger;
        this.config = config;
        this.providersFactory = providersFactory;
        this.eventService = eventService;
        this.publisher = publisher;
        this.settingsStore = settingsStore;
        this.providerRegistry = providerRegistry;
        this.providerLifecycle = providerLifecycle;
        this.providerConnectionManager = providerConnectionManager;
        this.secretsCache = secretsCache;
        this.secretsProviderConnectionRepository = secretsProviderConnectionRepository;
        this.cipher = cipher;
        this.initialized = false;
        this.logger = this.logger.scoped('external-secrets');
    }
    async init() {
        if (this.initialized)
            return;
        this.initializingPromise ??= (async () => {
            try {
                await this.reloadAllProviders();
                this.initialized = true;
                this.logger.debug('External secrets manager initialized');
            }
            catch (error) {
                this.logger.error('External secrets manager failed to initialize', { error });
                throw error;
            }
            finally {
                this.initializingPromise = undefined;
            }
        })();
        await this.initializingPromise;
    }
    shutdown() {
        this.providerConnectionManager.shutdown();
        this.initialized = false;
        this.logger.debug('External secrets manager shut down');
    }
    getProvider(provider) {
        return this.providerRegistry.get(provider);
    }
    getProviderProperties(providerType) {
        const ProviderClass = this.providersFactory.getProvider(providerType);
        if (!ProviderClass) {
            throw new errors_1.NotFoundError(`Provider type "${providerType}" not found`);
        }
        return new ProviderClass().properties;
    }
    hasProvider(provider) {
        return this.providerRegistry.has(provider);
    }
    getProviderNames() {
        return this.providerRegistry.getNames();
    }
    getProvidersWithSettings() {
        const allProviderClasses = this.providersFactory.getAllProviders();
        const settings = this.getCachedSettings();
        return Object.entries(allProviderClasses).map(([name, providerClass]) => ({
            provider: this.providerRegistry.get(name) ?? new providerClass(),
            settings: settings[name] ?? {},
        }));
    }
    getProviderWithSettings(provider) {
        const ProviderClass = this.providersFactory.getProvider(provider);
        const settings = this.getCachedSettings();
        return {
            provider: this.providerRegistry.get(provider) ?? new ProviderClass(),
            settings: settings[provider] ?? {},
        };
    }
    async syncProviderConnection(providerKey) {
        const connection = await this.secretsProviderConnectionRepository.findOne({
            where: { providerKey },
        });
        if (connection?.isEnabled) {
            const settings = await this.decryptSettings(connection.encryptedSettings);
            const connectionSettings = {
                connected: true,
                connectedAt: null,
                settings,
            };
            await this.providerConnectionManager.upsertProviderConnection({
                providerKey,
                providerType: connection.type,
                config: connectionSettings,
            });
        }
        else {
            await this.providerConnectionManager.removeProviderConnection(providerKey);
        }
        this.broadcastReload();
    }
    async updateProvider(providerKey) {
        const providerInstance = this.providerRegistry.get(providerKey);
        if (!providerInstance) {
            throw new errors_1.NotFoundError(`Provider "${providerKey}" not found`);
        }
        if (providerInstance.state !== 'connected') {
            throw new n8n_workflow_1.UnexpectedError(`Provider "${providerKey}" is not connected`);
        }
        await providerInstance.update();
        this.broadcastReload();
        this.logger.debug(`Updated provider ${providerKey}`);
        this.eventService.emit('external-secrets-provider-reloaded', {
            vaultType: providerKey,
        });
    }
    getSecret(provider, name) {
        return this.secretsCache.getSecret(provider, name);
    }
    hasSecret(provider, name) {
        return this.secretsCache.hasSecret(provider, name);
    }
    getSecretNames(provider) {
        return this.secretsCache.getSecretNames(provider);
    }
    getAllSecretNames() {
        return this.secretsCache.getAllSecretNames();
    }
    async setProviderSettings(provider, settings, userId) {
        const { isNewProvider } = await this.settingsStore.updateProvider(provider, { settings });
        await this.reloadProvider(provider);
        this.broadcastReload();
        void this.trackProviderSave(provider, isNewProvider, userId);
    }
    async setProviderConnected(provider, connected) {
        await this.settingsStore.updateProvider(provider, { connected });
        if (connected) {
            await this.reloadProvider(provider);
        }
        else {
            await this.providerConnectionManager.disconnectProvider(provider);
        }
        this.broadcastReload();
    }
    async testProviderSettings(provider, data) {
        const testSettings = {
            connected: true,
            connectedAt: new Date(),
            settings: data,
        };
        const errorState = {
            success: false,
            testState: 'error',
        };
        const result = await this.providerLifecycle.initialize(provider, testSettings);
        if (!result.success || !result.provider) {
            return errorState;
        }
        try {
            const connectResult = await this.providerLifecycle.connect(result.provider);
            if (!connectResult.success) {
                return {
                    ...errorState,
                    error: connectResult.error?.message,
                };
            }
            const [success, error] = await result.provider.test();
            if (!success) {
                return { success: false, testState: 'error', error };
            }
            const currentSettings = await this.settingsStore.getProvider(provider);
            const testState = currentSettings?.connected ? 'connected' : 'tested';
            return { success: true, testState };
        }
        catch {
            return errorState;
        }
        finally {
            await result.provider?.disconnect();
        }
    }
    async reloadAllProviders() {
        if (this.config.externalSecretsForProjects || this.config.externalSecretsMultipleConnections) {
            await this.reloadProvidersFromConnectionsRepo();
            return;
        }
        this.logger.debug('Reloading all external secrets providers');
        const newSettings = await this.settingsStore.reload();
        await this.providerConnectionManager.upsertProviderConnections(Object.entries(newSettings).map(([providerKey, config]) => ({
            providerKey,
            providerType: providerKey,
            config,
        })));
        this.logger.debug('Reloaded all external secrets providers');
    }
    async reloadProvidersFromConnectionsRepo() {
        const connections = await this.secretsProviderConnectionRepository.findAll();
        const providerConnections = [];
        for (const connection of connections) {
            if (!connection.isEnabled) {
                await this.providerConnectionManager.removeProviderConnection(connection.providerKey);
                continue;
            }
            const settings = await this.decryptSettings(connection.encryptedSettings);
            const connectionSettings = {
                connected: true,
                connectedAt: null,
                settings,
            };
            providerConnections.push({
                providerKey: connection.providerKey,
                providerType: connection.type,
                config: connectionSettings,
            });
        }
        await this.providerConnectionManager.upsertProviderConnections(providerConnections);
        this.logger.debug('Reloaded external secrets providers');
    }
    async reloadProvider(name) {
        const config = await this.settingsStore.getProvider(name);
        if (!config) {
            this.logger.warn(`Cannot reload provider ${name}: settings not found`);
            return;
        }
        await this.providerConnectionManager.upsertProviderConnection({
            providerKey: name,
            providerType: name,
            config,
        });
    }
    async decryptSettings(encryptedData) {
        try {
            const decryptedData = await this.cipher.decryptV2(encryptedData);
            return (0, n8n_workflow_1.jsonParse)(decryptedData);
        }
        catch (e) {
            this.logger.error('Failed to decrypt external secrets settings', { error: e });
            throw new n8n_workflow_1.UnexpectedError('External Secrets Settings could not be decrypted. The likely reason is that a different "encryptionKey" was used to encrypt the data.');
        }
    }
    async updateSecrets(signal) {
        await this.secretsCache.refreshAll(signal);
    }
    broadcastReload() {
        void this.publisher.publishCommand({ command: 'reload-external-secrets-providers' });
    }
    async trackProviderSave(vaultType, isNew, userId) {
        let testResult;
        try {
            testResult = await this.getProvider(vaultType)?.test();
        }
        catch { }
        this.eventService.emit('external-secrets-provider-settings-saved', {
            userId,
            vaultType,
            isNew,
            isValid: testResult?.[0] ?? false,
            errorMessage: testResult?.[1],
        });
    }
    getCachedSettings() {
        return this.settingsStore.getCached();
    }
};
exports.ExternalSecretsManager = ExternalSecretsManager;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-external-secrets-providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExternalSecretsManager.prototype, "reloadAllProviders", null);
exports.ExternalSecretsManager = ExternalSecretsManager = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, external_secrets_config_1.ExternalSecretsConfig, external_secrets_providers_ee_1.ExternalSecretsProviders, backend_services_1.EventService, publisher_service_1.Publisher, settings_store_service_1.ExternalSecretsSettingsStore, provider_registry_service_1.ExternalSecretsProviderRegistry, provider_lifecycle_service_1.ExternalSecretsProviderLifecycle, external_secrets_provider_connection_manager_ee_1.ExternalSecretsProviderConnectionManager, secrets_cache_service_1.ExternalSecretsSecretsCache, db_1.SecretsProviderConnectionRepository, n8n_core_1.Cipher])
], ExternalSecretsManager);
//# sourceMappingURL=external-secrets-manager.ee.js.map