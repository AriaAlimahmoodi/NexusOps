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
exports.ExternalSecretsSecretsCache = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const node_util_1 = require("node:util");
const external_secrets_config_1 = require("./external-secrets.config");
const provider_registry_service_1 = require("./provider-registry.service");
const with_timeout_1 = require("./with-timeout");
let ExternalSecretsSecretsCache = class ExternalSecretsSecretsCache {
    constructor(logger, registry, config) {
        this.logger = logger;
        this.registry = registry;
        this.config = config;
        this.inFlight = new WeakMap();
        this.logger = this.logger.scoped('external-secrets');
    }
    async refreshAll(signal) {
        const refreshes = Promise.all(Array.from(this.registry.getAll().entries()).map(async ([name, provider]) => [name, await this.refreshProvider(name, provider)]));
        const outcomes = await Promise.race([
            refreshes,
            (0, node_util_1.aborted)(signal, refreshes).then(() => undefined),
        ]);
        if (!outcomes)
            return;
        const connected = outcomes.filter(([, outcome]) => outcome !== 'not-connected');
        if (connected.length > 0 && connected.every(([, outcome]) => outcome === 'failed')) {
            throw new n8n_workflow_1.OperationalError('No connected external secrets provider refreshed', {
                level: 'error',
                extra: { providers: connected.map(([name]) => name) },
            });
        }
        this.logger.debug('Refreshed secrets from all providers');
    }
    async refreshProvider(name, provider) {
        if (provider.state !== 'connected') {
            return 'not-connected';
        }
        try {
            await this.updateProvider(name, provider);
            return 'refreshed';
        }
        catch (error) {
            if (error instanceof with_timeout_1.TimeoutError) {
                this.logger.warn(`Secrets refresh for provider ${name} is still running`, {
                    error,
                });
            }
            else {
                this.logger.error(`Error refreshing secrets from provider ${name}`, {
                    error: (0, ensure_error_1.ensureError)(error),
                });
            }
            return 'failed';
        }
    }
    async updateProvider(name, provider) {
        let pull = this.inFlight.get(provider);
        if (!pull) {
            pull = provider.update().finally(() => this.inFlight.delete(provider));
            pull.catch(() => { });
            this.inFlight.set(provider, pull);
        }
        const timeoutMs = this.config.refreshTimeout * constants_1.Time.seconds.toMilliseconds;
        await (0, with_timeout_1.withTimeout)(pull, timeoutMs, `Timed out refreshing secrets after ${timeoutMs}ms`);
        this.logger.debug(`Refreshed secrets from provider ${name}`);
    }
    getSecret(providerName, secretName) {
        const provider = this.registry.get(providerName);
        return provider?.getSecret(secretName);
    }
    hasSecret(providerName, secretName) {
        const provider = this.registry.get(providerName);
        return provider?.hasSecret(secretName) ?? false;
    }
    getSecretNames(providerName) {
        const provider = this.registry.get(providerName);
        return provider?.getSecretNames() ?? [];
    }
    getAllSecretNames() {
        const providers = this.registry.getAll();
        const result = {};
        for (const [name, provider] of providers.entries()) {
            result[name] = provider.getSecretNames();
        }
        return result;
    }
};
exports.ExternalSecretsSecretsCache = ExternalSecretsSecretsCache;
exports.ExternalSecretsSecretsCache = ExternalSecretsSecretsCache = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, provider_registry_service_1.ExternalSecretsProviderRegistry, external_secrets_config_1.ExternalSecretsConfig])
], ExternalSecretsSecretsCache);
//# sourceMappingURL=secrets-cache.service.js.map