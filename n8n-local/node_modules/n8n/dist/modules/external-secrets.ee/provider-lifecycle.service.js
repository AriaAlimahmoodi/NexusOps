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
exports.ExternalSecretsProviderLifecycle = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const external_secrets_providers_ee_1 = require("./external-secrets-providers.ee");
let ExternalSecretsProviderLifecycle = class ExternalSecretsProviderLifecycle {
    constructor(logger, providersFactory) {
        this.logger = logger;
        this.providersFactory = providersFactory;
        this.logger = this.logger.scoped('external-secrets');
    }
    async initialize(name, settings) {
        const providerClass = this.providersFactory.getProvider(name);
        if (!providerClass) {
            return {
                success: false,
                error: new Error(`Provider class not found: ${name}`),
            };
        }
        const provider = new providerClass();
        try {
            this.logger.debug(`Initializing secrets provider ${provider.displayName} (${name})`);
            await provider.init(settings);
            provider.setState('initialized');
            return {
                success: true,
                provider,
            };
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Validation error initializing secrets provider ${provider.displayName} (${name})`, { error });
            provider.setState('error', error);
            return {
                success: false,
                provider,
                error,
            };
        }
    }
    async connect(provider) {
        try {
            this.logger.debug(`Connecting secrets provider ${provider.displayName} (${provider.name})`);
            provider.setState('connecting');
            await provider.connect();
            if (provider.state === 'error') {
                return {
                    success: false,
                    error: provider.lastError ?? new Error('Provider entered error state during connection'),
                };
            }
            this.logger.debug(`Successfully connected secrets provider ${provider.displayName}`);
            return { success: true };
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Connection error for secrets provider ${provider.displayName} (${provider.name})`, { error });
            provider.setState('error', error);
            return {
                success: false,
                error,
            };
        }
    }
    async disconnect(provider) {
        try {
            await provider.disconnect();
            provider.setState('initializing');
            this.logger.debug(`Disconnected secrets provider ${provider.displayName}`);
        }
        catch (error) {
            this.logger.warn(`Error disconnecting provider ${provider.displayName}`, {
                error: (0, ensure_error_1.ensureError)(error),
            });
        }
    }
    async reload(provider, settings) {
        await this.disconnect(provider);
        return await this.initialize(provider.name, settings);
    }
};
exports.ExternalSecretsProviderLifecycle = ExternalSecretsProviderLifecycle;
exports.ExternalSecretsProviderLifecycle = ExternalSecretsProviderLifecycle = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, external_secrets_providers_ee_1.ExternalSecretsProviders])
], ExternalSecretsProviderLifecycle);
//# sourceMappingURL=provider-lifecycle.service.js.map