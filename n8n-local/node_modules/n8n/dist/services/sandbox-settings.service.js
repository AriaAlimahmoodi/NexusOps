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
exports.SandboxSettingsService = exports.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY = exports.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY = void 0;
const sandbox_1 = require("@n8n/agents/sandbox");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const instance_credential_broker_1 = require("../credentials/instance-credential-broker");
const errors_1 = require("@n8n/errors");
const N8N_SANDBOX_HEADER_NAME = 'x-api-key';
function requireConnectionValue(type, data, field) {
    const value = data[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new errors_1.UnprocessableRequestError(`The field "${field}" is required for provider connection type "${type}"`);
    }
    return value.trim();
}
function requireHttpUrl(type, data, field) {
    const value = requireConnectionValue(type, data, field);
    try {
        const url = new URL(value);
        if (url.protocol === 'http:' || url.protocol === 'https:')
            return value;
    }
    catch { }
    throw new errors_1.UnprocessableRequestError(`The field "${field}" must be a valid HTTP URL for provider connection type "${type}"`);
}
function parseSandboxServiceCredential({ type, data }) {
    const headerName = requireConnectionValue(type, data, 'name').toLowerCase();
    if (headerName !== N8N_SANDBOX_HEADER_NAME) {
        throw new errors_1.UnprocessableRequestError(`The credential's header name must be "${N8N_SANDBOX_HEADER_NAME}" but is "${headerName}"`);
    }
    return requireConnectionValue(type, data, 'value');
}
function parseDaytonaCredential({ type, data }) {
    return {
        apiUrl: requireHttpUrl(type, data, 'apiUrl'),
        apiKey: requireConnectionValue(type, data, 'apiKey'),
    };
}
exports.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY = {
    id: 'instance-ai:sandbox:daytona',
    credentialTypes: ['daytonaApi'],
    validate: parseDaytonaCredential,
};
exports.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY = {
    id: 'instance-ai:sandbox:n8n',
    credentialTypes: ['httpHeaderAuth'],
    validate: parseSandboxServiceCredential,
};
let SandboxSettingsService = class SandboxSettingsService {
    constructor(globalConfig, instanceCredentialBroker, logger) {
        this.instanceCredentialBroker = instanceCredentialBroker;
        this.logger = logger;
        this.credentialUsesRegistered = false;
        this.config = globalConfig.instanceAi;
        this.agentsConfig = globalConfig.agents;
        this.deploymentConfig = globalConfig.deployment;
        this.config.sandboxProvider = this.getProvider();
    }
    isAgentSandboxEnabled() {
        return this.agentsConfig.sandboxEnabled || this.config.sandboxEnabled;
    }
    getProvider() {
        return (0, sandbox_1.normalizeSandboxProvider)(this.config.sandboxProvider);
    }
    registerCredentialUses() {
        if (this.credentialUsesRegistered)
            return;
        this.instanceCredentialBroker.registerUse(exports.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY);
        this.instanceCredentialBroker.registerUse(exports.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY);
        this.credentialUsesRegistered = true;
    }
    async resolveDaytonaConfig() {
        const { daytonaApiUrl, daytonaApiKey } = this.config;
        const envConfig = {
            apiUrl: daytonaApiUrl || undefined,
            apiKey: daytonaApiKey || undefined,
        };
        const resolved = await this.resolveServiceCredential(exports.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY, 'Daytona sandbox');
        if (!resolved)
            return envConfig;
        try {
            return parseDaytonaCredential(resolved);
        }
        catch (error) {
            this.warnCredentialFallback('Daytona sandbox', exports.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY.id, (0, ensure_error_1.ensureError)(error).message);
            return envConfig;
        }
    }
    async resolveN8nSandboxConfig(ctx) {
        const { n8nSandboxServiceUrl, n8nSandboxServiceApiKey } = this.config;
        const envConfig = {
            serviceUrl: n8nSandboxServiceUrl || undefined,
            apiKey: n8nSandboxServiceApiKey || undefined,
        };
        const resolved = await this.resolveServiceCredential(exports.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY, 'n8n Sandbox', ctx);
        if (!resolved)
            return envConfig;
        try {
            const apiKey = parseSandboxServiceCredential(resolved);
            return { serviceUrl: n8nSandboxServiceUrl || undefined, apiKey };
        }
        catch (error) {
            this.warnCredentialFallback('n8n Sandbox', exports.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY.id, (0, ensure_error_1.ensureError)(error).message);
            return envConfig;
        }
    }
    async resolveServiceCredential(policy, service, ctx) {
        if (this.deploymentConfig.type === 'cloud')
            return null;
        const resolved = ctx
            ? this.instanceCredentialBroker.resolveForUse(policy, ctx)
            : this.instanceCredentialBroker.resolveForUse(policy);
        return await resolved.catch((error) => {
            this.warnCredentialFallback(service, policy.id, (0, ensure_error_1.ensureError)(error).message);
            return null;
        });
    }
    warnCredentialFallback(service, credentialUseId, reason) {
        this.logger
            .scoped('instance-ai')
            .warn(`Could not resolve the configured ${service} credential; using environment fallback`, {
            credentialUseId,
            error: reason,
        });
    }
};
exports.SandboxSettingsService = SandboxSettingsService;
exports.SandboxSettingsService = SandboxSettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, instance_credential_broker_1.InstanceCredentialBroker, backend_common_1.Logger])
], SandboxSettingsService);
//# sourceMappingURL=sandbox-settings.service.js.map