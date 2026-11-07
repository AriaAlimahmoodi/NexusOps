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
exports.ExternalSecretsService = void 0;
const di_1 = require("@n8n/di");
const external_secrets_manager_ee_1 = require("./external-secrets-manager.ee");
const redaction_service_ee_1 = require("./redaction.service.ee");
let ExternalSecretsService = class ExternalSecretsService {
    constructor(externalSecretsManager, redactionService) {
        this.externalSecretsManager = externalSecretsManager;
        this.redactionService = redactionService;
    }
    getProvider(providerName) {
        const providerAndSettings = this.externalSecretsManager.getProviderWithSettings(providerName);
        const { provider, settings } = providerAndSettings;
        return {
            displayName: provider.displayName,
            name: provider.name,
            icon: provider.name,
            state: provider.state,
            connected: settings.connected,
            connectedAt: settings.connectedAt,
            properties: provider.properties,
            data: this.redact(settings.settings, provider),
        };
    }
    getProviders() {
        return this.externalSecretsManager.getProvidersWithSettings().map(({ provider, settings }) => ({
            displayName: provider.displayName,
            name: provider.name,
            icon: provider.name,
            state: provider.state,
            connected: !!settings.connected,
            connectedAt: settings.connectedAt,
            data: this.redact(settings.settings, provider),
        }));
    }
    redact(data, provider) {
        return this.redactionService.redact(data, provider.properties);
    }
    unredact(redactedData, savedData) {
        return this.redactionService.unredact(redactedData, savedData);
    }
    async saveProviderSettings(providerName, data, userId) {
        const providerAndSettings = this.externalSecretsManager.getProviderWithSettings(providerName);
        const { settings } = providerAndSettings;
        const newData = this.unredact(data, settings.settings);
        await this.externalSecretsManager.setProviderSettings(providerName, newData, userId);
    }
    async saveProviderConnected(providerName, connected) {
        await this.externalSecretsManager.setProviderConnected(providerName, connected);
        return this.getProvider(providerName);
    }
    getAllSecrets() {
        return this.externalSecretsManager.getAllSecretNames();
    }
    async testProviderSettings(providerName, data) {
        const providerAndSettings = this.externalSecretsManager.getProviderWithSettings(providerName);
        const { settings } = providerAndSettings;
        const newData = this.unredact(data, settings.settings);
        return await this.externalSecretsManager.testProviderSettings(providerName, newData);
    }
    async updateProvider(providerName) {
        return await this.externalSecretsManager.updateProvider(providerName);
    }
};
exports.ExternalSecretsService = ExternalSecretsService;
exports.ExternalSecretsService = ExternalSecretsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [external_secrets_manager_ee_1.ExternalSecretsManager, redaction_service_ee_1.RedactionService])
], ExternalSecretsService);
//# sourceMappingURL=external-secrets.service.ee.js.map