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
exports.ExternalSecretsProviderConnectionManager = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const provider_lifecycle_service_1 = require("./provider-lifecycle.service");
const provider_registry_service_1 = require("./provider-registry.service");
const retry_manager_service_1 = require("./retry-manager.service");
const secrets_cache_service_1 = require("./secrets-cache.service");
const with_timeout_1 = require("./with-timeout");
let ExternalSecretsProviderConnectionManager = class ExternalSecretsProviderConnectionManager {
    constructor(logger, providerRegistry, providerLifecycle, retryManager, secretsCache) {
        this.logger = logger;
        this.providerRegistry = providerRegistry;
        this.providerLifecycle = providerLifecycle;
        this.retryManager = retryManager;
        this.secretsCache = secretsCache;
        this.replacementCandidates = new Map();
        this.logger = this.logger.scoped('external-secrets');
    }
    async upsertProviderConnection(input) {
        await this.prepareProviderConnection(input);
    }
    async upsertProviderConnections(inputs) {
        await Promise.all(inputs.map(async (input) => await this.prepareProviderConnection(input)));
    }
    shutdown() {
        const candidates = [...this.replacementCandidates.values()];
        this.replacementCandidates.clear();
        this.retryManager.cancelAll();
        for (const candidate of candidates) {
            void this.disposeSupersededCandidate(candidate, 'shutdown');
        }
        void this.providerRegistry.disconnectAll();
    }
    async prepareProviderConnection({ providerKey, providerType, config, }) {
        if (this.providerRegistry.has(providerKey) || this.replacementCandidates.has(providerKey)) {
            await this.replaceProviderConnection(providerKey, providerType, config);
            return;
        }
        await this.addProviderConnection(providerKey, providerType, config);
    }
    async removeProviderConnection(providerKey) {
        await this.invalidateReplacement(providerKey);
        this.logger.debug('Removing external secrets provider connection', {
            providerKey,
        });
        const existingProvider = this.providerRegistry.get(providerKey);
        this.providerRegistry.remove(providerKey);
        if (existingProvider) {
            await this.providerLifecycle.disconnect(existingProvider);
        }
    }
    async disconnectProvider(providerKey) {
        await this.invalidateReplacement(providerKey);
        const provider = this.providerRegistry.get(providerKey);
        this.providerRegistry.remove(providerKey);
        if (provider) {
            await this.providerLifecycle.disconnect(provider);
        }
    }
    async addProviderConnection(providerKey, providerType, config) {
        this.logger.debug('Adding external secrets provider connection', {
            providerKey,
            providerType,
        });
        const result = await this.providerLifecycle.initialize(providerType, config);
        if (!result.success || !result.provider) {
            this.logger.error('Failed to initialize external secrets provider connection', {
                providerKey,
                providerType,
                error: result.error,
            });
            return;
        }
        this.providerRegistry.set(providerKey, result.provider);
        if (config.connected) {
            const provider = result.provider;
            await this.retryManager.runWithRetry(providerKey, async () => await this.connectAndHydrate(providerKey, provider));
        }
    }
    async connectAndHydrate(providerKey, provider) {
        if (this.providerRegistry.get(providerKey) !== provider)
            return { success: true };
        if (provider.state !== 'connected') {
            const connectResult = await this.providerLifecycle.connect(provider);
            if (!connectResult.success)
                return connectResult;
        }
        try {
            await this.secretsCache.updateProvider(providerKey, provider);
            return { success: true };
        }
        catch (error) {
            if (error instanceof with_timeout_1.TimeoutError) {
                this.logger.debug(`Hydration of provider ${providerKey} continues in the background`);
                return { success: true };
            }
            return { success: false, error: (0, ensure_error_1.ensureError)(error) };
        }
    }
    async replaceProviderConnection(providerKey, providerType, config) {
        const candidate = this.beginReplacement(providerKey, providerType);
        const initResult = await this.providerLifecycle.initialize(providerType, config);
        candidate.provider = initResult.provider;
        if (!initResult.success || !initResult.provider) {
            await this.settleReplacement(candidate, {
                kind: 'failed',
                phase: 'initialization',
                provider: initResult.provider,
                error: initResult.error ?? new n8n_workflow_1.UnexpectedError(`Failed to initialize provider ${providerKey}`),
            });
            return;
        }
        if (!config.connected) {
            await this.settleReplacement(candidate, {
                kind: 'ready',
                phase: 'disconnected',
                provider: initResult.provider,
            });
            return;
        }
        await this.runIfCurrentWithRetry(candidate, 'initialization', async () => await this.connectReplacement(candidate));
    }
    async runIfCurrentWithRetry(candidate, phase, operation) {
        if (!this.isCurrentReplacement(candidate)) {
            await this.disposeSupersededCandidate(candidate, phase);
            return;
        }
        await this.retryManager.runWithRetry(candidate.providerKey, operation);
    }
    beginReplacement(providerKey, providerType) {
        const previous = this.replacementCandidates.get(providerKey);
        const hadPendingRetry = this.retryManager.cancelRetry(providerKey);
        const outgoing = hadPendingRetry || previous?.provider?.state === 'connected' ? previous : undefined;
        const candidate = { providerKey, providerType };
        this.replacementCandidates.set(providerKey, candidate);
        this.logger.debug('External secrets provider replacement started', {
            providerKey,
            providerType,
            phase: 'initialization',
        });
        if (outgoing)
            void this.disposeSupersededCandidate(outgoing, 'superseded');
        return candidate;
    }
    async connectReplacement(candidate) {
        const provider = candidate.provider;
        if (!provider) {
            return { success: true };
        }
        if (this.providerRegistry.get(candidate.providerKey) === provider) {
            this.providerRegistry.remove(candidate.providerKey);
        }
        const connectResult = await this.providerLifecycle.connect(provider);
        if (connectResult.success) {
            this.startReplacementHydration(candidate, provider);
            return { success: true };
        }
        const published = await this.publishRetryableFailure(candidate, connectResult.error ??
            new n8n_workflow_1.UnexpectedError(`Failed to connect provider ${candidate.providerKey}`), 'connection');
        return published ? connectResult : { success: true };
    }
    startReplacementHydration(candidate, provider) {
        void this.runIfCurrentWithRetry(candidate, 'hydration', async () => await this.hydrateReplacement(candidate, provider)).catch((error) => {
            this.logger.error('Unexpected error settling external secrets provider replacement', {
                providerKey: candidate.providerKey,
                providerType: candidate.providerType,
                phase: 'hydration-settlement',
                error: (0, ensure_error_1.ensureError)(error),
            });
        });
    }
    async hydrateReplacement(candidate, provider) {
        try {
            await provider.update();
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            const published = await this.publishRetryableFailure(candidate, error, 'hydration');
            return published ? { success: false, error } : { success: true };
        }
        await this.settleReplacement(candidate, {
            kind: 'ready',
            phase: 'hydration',
            provider,
        });
        return { success: true };
    }
    async settleReplacement(candidate, outcome) {
        if (!this.isCurrentReplacement(candidate)) {
            await this.disposeSupersededCandidate(candidate, outcome.phase);
            return;
        }
        const existingProvider = this.providerRegistry.get(candidate.providerKey);
        const keepPredecessor = outcome.kind === 'failed' && this.isServingPredecessor(existingProvider, outcome.provider);
        if (outcome.kind === 'ready') {
            if (outcome.phase === 'hydration') {
                outcome.provider.setState('connected');
            }
            this.providerRegistry.set(candidate.providerKey, outcome.provider);
            this.logger.debug('External secrets provider replacement activated', {
                providerKey: candidate.providerKey,
                providerType: candidate.providerType,
                phase: outcome.phase,
            });
        }
        else {
            outcome.provider?.setState('error', outcome.error);
            if (keepPredecessor) {
                this.logger.error('External secrets provider replacement failed; previous provider stays active', {
                    providerKey: candidate.providerKey,
                    providerType: candidate.providerType,
                    phase: outcome.phase,
                    error: outcome.error,
                });
            }
            else {
                if (outcome.provider) {
                    this.providerRegistry.set(candidate.providerKey, outcome.provider);
                }
                else {
                    this.providerRegistry.remove(candidate.providerKey);
                }
                this.logger.error('External secrets provider replacement reached terminal failure', {
                    providerKey: candidate.providerKey,
                    providerType: candidate.providerType,
                    phase: outcome.phase,
                    error: outcome.error,
                });
            }
        }
        this.replacementCandidates.delete(candidate.providerKey);
        if (keepPredecessor) {
            await this.disposeSupersededCandidate(candidate, outcome.phase);
            return;
        }
        if (existingProvider && existingProvider !== outcome.provider) {
            await this.providerLifecycle.disconnect(existingProvider);
        }
    }
    async publishRetryableFailure(candidate, error, phase) {
        if (!this.isCurrentReplacement(candidate) || !candidate.provider) {
            await this.disposeSupersededCandidate(candidate, phase);
            return false;
        }
        candidate.provider.setState('error', error);
        this.logger.error(phase === 'connection'
            ? 'External secrets provider replacement connection attempt failed'
            : 'External secrets provider replacement hydration attempt failed', {
            providerKey: candidate.providerKey,
            providerType: candidate.providerType,
            phase,
            error,
        });
        const existingProvider = this.providerRegistry.get(candidate.providerKey);
        if (this.isServingPredecessor(existingProvider, candidate.provider)) {
            return true;
        }
        this.providerRegistry.set(candidate.providerKey, candidate.provider);
        if (existingProvider && existingProvider !== candidate.provider) {
            await this.providerLifecycle.disconnect(existingProvider);
        }
        return true;
    }
    async disposeSupersededCandidate(candidate, reason) {
        const { provider, providerKey, providerType } = candidate;
        const shouldDispose = provider !== undefined && this.providerRegistry.get(providerKey) !== provider;
        this.logger.debug('External secrets provider replacement candidate discarded', {
            providerKey,
            providerType,
            reason,
            disposed: shouldDispose,
        });
        if (shouldDispose) {
            await this.providerLifecycle.disconnect(provider);
        }
    }
    isCurrentReplacement(candidate) {
        return this.replacementCandidates.get(candidate.providerKey) === candidate;
    }
    isServingPredecessor(existing, candidateProvider) {
        return (existing !== undefined && existing !== candidateProvider && existing.state === 'connected');
    }
    async invalidateReplacement(providerKey) {
        const candidate = this.replacementCandidates.get(providerKey);
        this.replacementCandidates.delete(providerKey);
        this.retryManager.cancelRetry(providerKey);
        if (candidate)
            await this.disposeSupersededCandidate(candidate, 'invalidated');
    }
};
exports.ExternalSecretsProviderConnectionManager = ExternalSecretsProviderConnectionManager;
exports.ExternalSecretsProviderConnectionManager = ExternalSecretsProviderConnectionManager = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, provider_registry_service_1.ExternalSecretsProviderRegistry, provider_lifecycle_service_1.ExternalSecretsProviderLifecycle, retry_manager_service_1.ExternalSecretsRetryManager, secrets_cache_service_1.ExternalSecretsSecretsCache])
], ExternalSecretsProviderConnectionManager);
//# sourceMappingURL=external-secrets-provider-connection-manager.ee.js.map