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
exports.InstanceAiSetupTelemetryService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const instance_credential_broker_1 = require("../../credentials/instance-credential-broker");
const telemetry_2 = require("../../telemetry");
const instance_ai_settings_service_1 = require("./instance-ai-settings.service");
const SETUP_COMPLETED_KEY = 'instanceAi.setupCompletedAt';
const CREDENTIAL_TO_SEARCH_PROVIDER = {
    braveSearchApi: 'brave',
    searXngApi: 'searxng',
};
function extractModelName(model) {
    const slash = model.indexOf('/');
    return slash >= 0 ? model.slice(slash + 1) : model;
}
let InstanceAiSetupTelemetryService = class InstanceAiSetupTelemetryService {
    constructor(logger, globalConfig, eventService, telemetry, settingsRepository, instanceCredentialBroker, settingsService) {
        this.logger = logger;
        this.telemetry = telemetry;
        this.settingsRepository = settingsRepository;
        this.instanceCredentialBroker = instanceCredentialBroker;
        this.settingsService = settingsService;
        this.setupCompletionRecorded = false;
        this.logger = this.logger.scoped('instance-ai');
        this.config = globalConfig.instanceAi;
        this.deploymentConfig = globalConfig.deployment;
        eventService.on('instance-ai-settings-updated', ({ credentialSelections }) => {
            if (!credentialSelections)
                return;
            void this.reportSetupChanges(credentialSelections.previous, credentialSelections.next, credentialSelections.connectionsUpdated);
        });
    }
    isDirectSelfManaged() {
        return this.deploymentConfig.type !== 'cloud' && !this.settingsService.isProxyEnabled();
    }
    async providerForCredential(policy, providerByType, credentialId) {
        if (!credentialId)
            return null;
        const credentials = await this.instanceCredentialBroker.listForUse(policy);
        const type = credentials.find((credential) => credential.id === credentialId)?.type;
        return type ? (providerByType[type] ?? null) : null;
    }
    async modelProviderForCredential(credentialId) {
        return await this.providerForCredential(instance_ai_settings_service_1.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, instance_ai_settings_service_1.CREDENTIAL_TO_MODEL_PROVIDER, credentialId);
    }
    async searchProviderForCredential(credentialId) {
        const provider = await this.providerForCredential(instance_ai_settings_service_1.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, CREDENTIAL_TO_SEARCH_PROVIDER, credentialId);
        return provider === 'brave' || provider === 'searxng' ? provider : null;
    }
    sandboxTypeOf(selection) {
        if (selection.daytonaCredentialId)
            return 'daytona';
        if (selection.n8nSandboxCredentialId)
            return 'n8n-sandbox';
        return null;
    }
    async modelSnapshot(response, source) {
        if (source === 'env') {
            return {
                model_source: 'env',
                model_provider: this.config.model.split('/', 1)[0] || null,
                model_name: extractModelName(this.config.model) || null,
            };
        }
        if (source === 'ui') {
            return {
                model_source: 'ui',
                model_provider: await this.modelProviderForCredential(response.modelCredentialId),
                model_name: response.modelName,
            };
        }
        return { model_source: 'none', model_provider: null, model_name: null };
    }
    async searchSnapshot(response, source) {
        if (source === 'ui') {
            return {
                web_search_source: 'ui',
                web_search_provider: await this.searchProviderForCredential(response.searchCredentialId),
            };
        }
        if (source === 'env') {
            const provider = this.config.braveSearchApiKey.trim()
                ? 'brave'
                : this.config.searxngUrl.trim()
                    ? 'searxng'
                    : null;
            return { web_search_source: 'env', web_search_provider: provider };
        }
        return { web_search_source: source, web_search_provider: null };
    }
    async buildSetupSnapshot() {
        const response = await this.settingsService.getAdminSettings();
        const state = (0, api_types_1.deriveInstanceAiSetupState)(response);
        return {
            ...(await this.modelSnapshot(response, state.modelSource)),
            sandbox_source: state.sandboxSource,
            sandbox_type: state.sandboxType,
            ...(await this.searchSnapshot(response, state.webSearchSource)),
        };
    }
    async emitModelConfigured(previous, next, connectionUpdated) {
        const changed = connectionUpdated ||
            previous.modelCredentialId !== next.modelCredentialId ||
            previous.modelName !== next.modelName;
        if (!changed || !next.modelCredentialId || !next.modelName)
            return;
        const [provider, previousProvider] = await Promise.all([
            this.modelProviderForCredential(next.modelCredentialId),
            this.modelProviderForCredential(previous.modelCredentialId),
        ]);
        const hadModel = Boolean(previous.modelCredentialId && previous.modelName);
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.USER_CONFIGURED_AI_ASSISTANT_MODEL, {
            provider: provider ?? 'unknown',
            model: next.modelName,
            ...(hadModel && previousProvider ? { previous_provider: previousProvider } : {}),
            ...(hadModel && previous.modelName ? { previous_model: previous.modelName } : {}),
        });
    }
    emitSandboxConfigured(previous, next, connectionUpdated) {
        const changed = connectionUpdated ||
            previous.daytonaCredentialId !== next.daytonaCredentialId ||
            previous.n8nSandboxCredentialId !== next.n8nSandboxCredentialId;
        const nextSandboxType = this.sandboxTypeOf(next);
        if (!changed || !nextSandboxType)
            return;
        const previousSandboxType = this.sandboxTypeOf(previous);
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.USER_CONFIGURED_AI_ASSISTANT_SANDBOX, {
            sandbox_type: nextSandboxType,
            ...(previousSandboxType ? { previous_sandbox_type: previousSandboxType } : {}),
        });
    }
    async emitSearchConfigured(previous, next, connectionUpdated) {
        const changed = connectionUpdated || previous.searchCredentialId !== next.searchCredentialId;
        if (!changed || !next.searchCredentialId)
            return;
        const [provider, previousProvider] = await Promise.all([
            this.searchProviderForCredential(next.searchCredentialId),
            this.searchProviderForCredential(previous.searchCredentialId),
        ]);
        if (!provider)
            return;
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.USER_CONFIGURED_AI_ASSISTANT_WEB_SEARCH, {
            provider,
            ...(previousProvider ? { previous_provider: previousProvider } : {}),
        });
    }
    async reportSetupChanges(previous, next, connectionsUpdated = {
        model: false,
        sandbox: false,
        search: false,
    }) {
        if (!this.isDirectSelfManaged())
            return;
        try {
            await this.emitModelConfigured(previous, next, connectionsUpdated.model);
            this.emitSandboxConfigured(previous, next, connectionsUpdated.sandbox);
            await this.emitSearchConfigured(previous, next, connectionsUpdated.search);
        }
        catch (error) {
            this.logger.warn('Failed to report n8n Assistant setup telemetry', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
        await this.recordSetupCompletedIfNeeded();
    }
    async recordSetupCompletedIfNeeded() {
        if (!this.isDirectSelfManaged() || this.setupCompletionRecorded)
            return;
        try {
            if (!(await this.settingsService.isSetupCompleted()))
                return;
            const existing = await this.settingsRepository.findByKey(SETUP_COMPLETED_KEY);
            if (existing?.value) {
                this.setupCompletionRecorded = true;
                return;
            }
            const claimed = await this.settingsRepository.claimKey(SETUP_COMPLETED_KEY, new Date().toISOString());
            this.setupCompletionRecorded = true;
            if (!claimed)
                return;
            this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.AI_ASSISTANT_SETUP_COMPLETED, await this.buildSetupSnapshot());
        }
        catch (error) {
            this.logger.warn('Failed to record n8n Assistant setup completion', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
};
exports.InstanceAiSetupTelemetryService = InstanceAiSetupTelemetryService;
exports.InstanceAiSetupTelemetryService = InstanceAiSetupTelemetryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, backend_services_1.EventService, telemetry_2.Telemetry, db_1.SettingsRepository, instance_credential_broker_1.InstanceCredentialBroker, instance_ai_settings_service_1.InstanceAiSettingsService])
], InstanceAiSetupTelemetryService);
//# sourceMappingURL=instance-ai-setup-telemetry.service.js.map