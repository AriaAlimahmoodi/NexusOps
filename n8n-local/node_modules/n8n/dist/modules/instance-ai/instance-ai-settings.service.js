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
var InstanceAiSettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiSettingsService = exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY = exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY = exports.CREDENTIAL_TO_MODEL_PROVIDER = exports.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY = exports.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY = void 0;
const model_discovery_1 = require("@n8n/ai-utilities/model-discovery");
const backend_services_1 = require("@n8n/backend-services");
const node_util_1 = require("node:util");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const permissions_1 = require("@n8n/permissions");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../credentials/credentials.service");
const instance_credential_broker_1 = require("../../credentials/instance-credential-broker");
const errors_1 = require("@n8n/errors");
const ai_service_1 = require("../../services/ai.service");
const sandbox_settings_service_1 = require("../../services/sandbox-settings.service");
Object.defineProperty(exports, "INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY", { enumerable: true, get: function () { return sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY; } });
Object.defineProperty(exports, "INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY", { enumerable: true, get: function () { return sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY; } });
const user_service_1 = require("../../services/user.service");
const model_config_name_1 = require("./model-config-name");
const sandbox_provider_1 = require("./sandbox-provider");
const ADMIN_SETTINGS_KEY = 'instanceAi.settings';
const MODEL_PROVIDER_API_KEY_ENV = new Map([
    ['anthropic', 'ANTHROPIC_API_KEY'],
    ['cohere', 'COHERE_API_KEY'],
    ['deepseek', 'DEEPSEEK_API_KEY'],
    ['google', 'GOOGLE_GENERATIVE_AI_API_KEY'],
    ['groq', 'GROQ_API_KEY'],
    ['mistral', 'MISTRAL_API_KEY'],
    ['openai', 'OPENAI_API_KEY'],
    ['openrouter', 'OPENROUTER_API_KEY'],
    ['xai', 'XAI_API_KEY'],
]);
exports.CREDENTIAL_TO_MODEL_PROVIDER = {
    openAiApi: 'openai',
    anthropicApi: 'anthropic',
    googlePalmApi: 'google',
    groqApi: 'groq',
    deepSeekApi: 'deepseek',
    mistralCloudApi: 'mistral',
    xAiApi: 'xai',
    openRouterApi: 'openrouter',
    cohereApi: 'cohere',
};
const URL_FIELD_MAP = {
    openAiApi: 'url',
    anthropicApi: 'url',
    googlePalmApi: 'host',
};
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
            return;
    }
    catch { }
    throw new errors_1.UnprocessableRequestError(`The field "${field}" must be a valid HTTP URL for provider connection type "${type}"`);
}
function validateModelCredential({ type, data, }) {
    const apiKey = data.apiKey;
    if (typeof apiKey === 'string' && apiKey.trim().length > 0)
        return;
    const urlField = URL_FIELD_MAP[type];
    const url = urlField === undefined ? undefined : data[urlField];
    if (typeof url === 'string' && url.trim().length > 0)
        return;
    throw new errors_1.UnprocessableRequestError(urlField === undefined
        ? `The field "apiKey" is required for provider connection type "${type}"`
        : `The field "apiKey" or "${urlField}" is required for provider connection type "${type}"`);
}
function modelCredentialHeaders(credentialType, data) {
    const headers = {};
    if (credentialType === 'openAiApi' && typeof data.organizationId === 'string') {
        const organizationId = data.organizationId.trim();
        if (organizationId)
            headers['OpenAI-Organization'] = organizationId;
    }
    if ((credentialType === 'openAiApi' || credentialType === 'anthropicApi') &&
        data.header === true &&
        typeof data.headerName === 'string' &&
        typeof data.headerValue === 'string') {
        const headerName = data.headerName.trim();
        if (headerName)
            headers[headerName] = data.headerValue;
    }
    return Object.keys(headers).length ? headers : undefined;
}
function isVertexAnthropicModelId(id) {
    return id.startsWith('google-vertex-anthropic/');
}
function projectIdFromServiceAccountJson(json) {
    if (!json?.trim())
        return '';
    try {
        const parsed = JSON.parse(json);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
            return '';
        const projectId = parsed.project_id;
        return typeof projectId === 'string' ? projectId.trim() : '';
    }
    catch {
        return '';
    }
}
function validateSearchCredential({ type, data, }) {
    if (type === 'searXngApi')
        requireHttpUrl(type, data, 'apiUrl');
    else
        requireConnectionValue(type, data, 'apiKey');
}
exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY = {
    id: 'instance-ai:model',
    credentialTypes: api_types_1.INSTANCE_AI_MODEL_CREDENTIAL_TYPES,
    validate: validateModelCredential,
};
exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY = {
    id: 'instance-ai:search',
    credentialTypes: api_types_1.INSTANCE_AI_SEARCH_CREDENTIAL_TYPES,
    validate: validateSearchCredential,
};
function validateInstanceAiCredential(policy, credential) {
    if (policy === exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY) {
        validateModelCredential(credential);
    }
    else if (policy === sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY) {
        sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY.validate?.(credential);
    }
    else if (policy === sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY) {
        sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY.validate?.(credential);
    }
    else if (policy === exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY) {
        validateSearchCredential(credential);
    }
    else {
        throw new n8n_workflow_1.UnexpectedError(`Unknown instance AI credential policy "${policy.id}"`);
    }
}
let InstanceAiSettingsService = InstanceAiSettingsService_1 = class InstanceAiSettingsService {
    constructor(globalConfig, dbLockService, settingsRepository, userRepository, userService, aiService, credentialsService, credentialsFinderService, instanceCredentialBroker, sandboxSettingsService, eventService) {
        this.dbLockService = dbLockService;
        this.settingsRepository = settingsRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.aiService = aiService;
        this.credentialsService = credentialsService;
        this.credentialsFinderService = credentialsFinderService;
        this.instanceCredentialBroker = instanceCredentialBroker;
        this.sandboxSettingsService = sandboxSettingsService;
        this.eventService = eventService;
        this.enabled = true;
        this.mcpAccessEnabled = true;
        this.permissions = { ...api_types_1.DEFAULT_INSTANCE_AI_PERMISSIONS };
        this.adminModelName = null;
        this.searchDisabled = false;
        this.adminN8nSandboxServiceUrl = null;
        this.config = globalConfig.instanceAi;
        this.deploymentConfig = globalConfig.deployment;
        this.environmentSandboxProvider = this.sandboxSettingsService.getProvider();
        this.environmentN8nSandboxServiceUrl = this.config.n8nSandboxServiceUrl;
    }
    get isCloud() {
        return this.deploymentConfig.type === 'cloud';
    }
    isProxyEnabled() {
        return this.aiService.isProxyEnabled();
    }
    async loadFromDb() {
        const envSnapshot = {
            sandboxEnabled: this.config.sandboxEnabled,
            sandboxProvider: this.environmentSandboxProvider,
        };
        await this.reloadFromDb();
        const c = this.config;
        const overridden = c.sandboxEnabled !== envSnapshot.sandboxEnabled ||
            c.sandboxProvider !== envSnapshot.sandboxProvider;
        const logger = di_1.Container.get(backend_common_1.Logger).scoped('instance-ai');
        logger.info(`Sandbox: enabled=${c.sandboxEnabled} provider=${c.sandboxProvider}` +
            (overridden
                ? ` (DB override; env was enabled=${envSnapshot.sandboxEnabled} provider=${envSnapshot.sandboxProvider})`
                : ' (from env)'));
        const sandboxStatus = this.getSandboxStatus();
        if (sandboxStatus.unavailableReason) {
            logger.warn(`Sandbox unavailable: ${sandboxStatus.unavailableReason}`);
        }
    }
    async getAdminSettings() {
        if (this.isCloud) {
            return this.buildAdminSettingsResponse({
                modelCredentialId: null,
                modelName: null,
                daytonaCredentialId: null,
                n8nSandboxCredentialId: null,
                searchCredentialId: null,
            });
        }
        if (this.aiService.isProxyEnabled()) {
            const n8nSandboxCredentialId = await this.instanceCredentialBroker.getAssignedCredentialId(sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY);
            return this.buildAdminSettingsResponse({
                modelCredentialId: null,
                modelName: null,
                daytonaCredentialId: null,
                n8nSandboxCredentialId,
                searchCredentialId: null,
            });
        }
        const [modelSelection, daytonaCredentialId, n8nSandboxCredentialId, searchCredentialId] = await Promise.all([
            this.readAdminModelSelection(),
            this.instanceCredentialBroker.getAssignedCredentialId(sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY),
            this.instanceCredentialBroker.getAssignedCredentialId(sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY),
            this.instanceCredentialBroker.getAssignedCredentialId(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY),
        ]);
        return this.buildAdminSettingsResponse({
            ...modelSelection,
            daytonaCredentialId,
            n8nSandboxCredentialId,
            searchCredentialId,
        });
    }
    buildAdminSettingsResponse(credentialSelection) {
        const c = this.config;
        const modelProvider = c.model.split('/', 1)[0] ?? '';
        const modelProviderApiKeyEnv = MODEL_PROVIDER_API_KEY_ENV.get(modelProvider);
        const isProxyEnabled = this.aiService.isProxyEnabled();
        const isManaged = this.isCloud || isProxyEnabled;
        const providerModelApiKeyConfigured = Boolean(modelProviderApiKeyEnv && process.env[modelProviderApiKeyEnv]?.trim());
        const vertexModelEnvConfigured = modelProvider === 'google-vertex-anthropic' && Boolean(this.resolveVertexProjectId());
        const modelConnectionEnvConfigured = Boolean(c.modelApiKey.trim() ||
            c.modelUrl.trim() ||
            providerModelApiKeyConfigured ||
            vertexModelEnvConfigured);
        const sandboxEnvConfigured = this.hasEnvironmentSandboxConnection();
        const searchEnvConfigured = this.hasEnvironmentSearchConnection();
        const directEnvironmentConfig = !isManaged;
        const sandboxProvider = (0, sandbox_provider_1.normalizeSandboxProvider)(directEnvironmentConfig && sandboxEnvConfigured
            ? this.environmentSandboxProvider
            : c.sandboxProvider);
        return {
            enabled: this.enabled,
            permissions: { ...this.permissions },
            mcpAccessEnabled: this.mcpAccessEnabled,
            sandboxEnabled: c.sandboxEnabled,
            sandboxProvider,
            daytonaCredentialId: isManaged || (directEnvironmentConfig && sandboxEnvConfigured)
                ? null
                : credentialSelection.daytonaCredentialId,
            n8nSandboxCredentialId: this.isCloud || (directEnvironmentConfig && sandboxEnvConfigured)
                ? null
                : credentialSelection.n8nSandboxCredentialId,
            searchCredentialId: isManaged || (directEnvironmentConfig && searchEnvConfigured)
                ? null
                : credentialSelection.searchCredentialId,
            modelCredentialId: isManaged || (directEnvironmentConfig && modelConnectionEnvConfigured)
                ? null
                : credentialSelection.modelCredentialId,
            modelName: isManaged || this.hasEnvironmentModelName() ? null : credentialSelection.modelName,
            modelEnvConfigured: modelConnectionEnvConfigured,
            sandboxEnvConfigured,
            searchEnvConfigured,
            searchDisabled: directEnvironmentConfig && searchEnvConfigured ? false : this.searchDisabled,
            n8nSandboxServiceUrl: this.environmentN8nSandboxServiceUrl
                ? null
                : this.adminN8nSandboxServiceUrl,
            envManaged: {
                model: {
                    provider: modelConnectionEnvConfigured,
                    apiKey: Boolean(c.modelApiKey.trim() || providerModelApiKeyConfigured),
                    baseUrl: Boolean(c.modelUrl.trim()),
                    model: Boolean(process.env.N8N_INSTANCE_AI_MODEL?.trim()),
                },
                sandbox: {
                    provider: Boolean(process.env.N8N_INSTANCE_AI_SANDBOX_PROVIDER?.trim()),
                    serviceUrl: Boolean(this.environmentN8nSandboxServiceUrl.trim()),
                    apiKey: sandboxProvider === 'daytona'
                        ? Boolean(c.daytonaApiKey.trim())
                        : Boolean(c.n8nSandboxServiceApiKey.trim()),
                },
                search: {
                    provider: Boolean(c.braveSearchApiKey.trim() || c.searxngUrl.trim()),
                    apiKey: Boolean(c.braveSearchApiKey.trim()),
                    url: Boolean(c.searxngUrl.trim()),
                },
            },
            localGatewayDisabled: this.isLocalGatewayDisabled(),
            browserUseEnabled: this.isBrowserUseEnabled(),
        };
    }
    async updateAdminSettings(update, user) {
        this.rejectEnvironmentManagedFields(update);
        this.rejectManagedFields(update, InstanceAiSettingsService_1.MANAGED_ADMIN_FIELDS, this.deploymentLabel());
        if (this.isCloud) {
            this.rejectManagedFields(update, InstanceAiSettingsService_1.INSTANCE_CREDENTIAL_FIELDS, this.deploymentLabel());
            this.rejectManagedFields(update, [
                'modelName',
                'sandboxProvider',
                'sandboxEnabled',
                'n8nSandboxServiceUrl',
                'searchDisabled',
            ], this.deploymentLabel());
        }
        else if (this.aiService.isProxyEnabled()) {
            this.rejectManagedFields(update, ['modelCredentialId', 'searchCredentialId', 'modelConnection', 'searchConnection'], this.deploymentLabel());
            this.rejectManagedFields(update, ['modelName', 'sandboxEnabled', 'n8nSandboxServiceUrl', 'searchDisabled'], this.deploymentLabel());
            if (update.daytonaCredentialId !== null) {
                this.rejectManagedFields(update, ['daytonaCredentialId'], this.deploymentLabel());
            }
            if (update.sandboxConnection?.type === 'daytonaApi') {
                this.rejectManagedFields(update, ['sandboxConnection'], this.deploymentLabel());
            }
        }
        const { modelCredentialId: initialModelCredentialId, daytonaCredentialId: initialDaytonaCredentialId, n8nSandboxCredentialId: initialN8nSandboxCredentialId, searchCredentialId: initialSearchCredentialId, modelConnection, sandboxConnection, searchConnection, ...settingsUpdate } = update;
        let modelCredentialId = initialModelCredentialId;
        let daytonaCredentialId = initialDaytonaCredentialId;
        let n8nSandboxCredentialId = initialN8nSandboxCredentialId;
        let searchCredentialId = initialSearchCredentialId;
        if (settingsUpdate.searchDisabled === true) {
            if (searchConnection) {
                throw new errors_1.UnprocessableRequestError('Cannot disable web search while configuring a search connection');
            }
            searchCredentialId = null;
        }
        else if (searchConnection || typeof searchCredentialId === 'string') {
            settingsUpdate.searchDisabled = false;
        }
        this.rejectConnectionConflicts(update);
        if (modelConnection !== undefined ||
            sandboxConnection !== undefined ||
            searchConnection !== undefined) {
            if (!user || !(0, permissions_1.hasGlobalScope)(user, 'credential:manageInstance')) {
                throw new errors_1.ForbiddenError('You do not have permission to manage provider connections');
            }
        }
        if (modelConnection) {
            const modelName = settingsUpdate.modelName === undefined
                ? (await this.readAdminModelSelection()).modelName
                : settingsUpdate.modelName;
            if (modelName === null) {
                throw new errors_1.UnprocessableRequestError('modelName must be set together with modelCredentialId');
            }
        }
        const [modelPrepared, searchPrepared, sandboxPrepared] = user
            ? await Promise.all([
                this.prepareConnection(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, 'n8n Assistant model', modelConnection),
                this.prepareConnection(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, 'n8n Assistant web search', searchConnection),
                this.prepareSandboxConnection(sandboxConnection),
            ])
            : [undefined, undefined, undefined];
        this.validateAdminSettingsUpdate(update, this.snapshotAdminSettings(), sandboxConnection === null
            ? this.environmentSandboxProvider
            : sandboxConnection?.type === 'daytonaApi'
                ? 'daytona'
                : sandboxConnection?.type === 'httpHeaderAuth'
                    ? 'n8n-sandbox'
                    : settingsUpdate.sandboxProvider);
        await this.runConnectionHooks([modelPrepared, searchPrepared, sandboxPrepared]);
        const { previous, next, credentialSelection, previousSelection } = await this.dbLockService.withLockContext(1007, async (ctx) => {
            if (user && modelConnection !== undefined) {
                modelCredentialId = await this.upsertConnection(user, exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, 'n8n Assistant model', modelConnection, ctx, modelPrepared);
            }
            if (user && searchConnection !== undefined) {
                searchCredentialId = await this.upsertConnection(user, exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, 'n8n Assistant web search', searchConnection, ctx, searchPrepared);
            }
            if (user && sandboxConnection !== undefined) {
                const sandbox = await this.upsertSandboxConnection(user, sandboxConnection, ctx, sandboxPrepared);
                daytonaCredentialId = sandbox.daytonaCredentialId;
                n8nSandboxCredentialId = sandbox.n8nSandboxCredentialId;
                if (sandbox.sandboxProvider)
                    settingsUpdate.sandboxProvider = sandbox.sandboxProvider;
            }
            const updateCredentialAssignment = async (credentialUse, credentialId) => {
                if (credentialId === undefined)
                    return;
                if (credentialId === null) {
                    await this.instanceCredentialBroker.clearForUse(credentialUse, ctx);
                }
                else {
                    await this.instanceCredentialBroker.assignForUse(credentialUse, credentialId, ctx);
                }
            };
            const persisted = await this.settingsRepository.findByKeyInContext(ADMIN_SETTINGS_KEY, ctx);
            const current = this.mergeAdminSettings(this.snapshotAdminSettings(), this.parsePersistedAdminSettings(persisted?.value));
            const [currentModelCredentialId, currentDaytonaCredentialId, currentN8nCredentialId, currentSearchCredentialId,] = await Promise.all([
                this.instanceCredentialBroker.getAssignedCredentialId(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, ctx),
                this.instanceCredentialBroker.getAssignedCredentialId(sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY, ctx),
                this.instanceCredentialBroker.getAssignedCredentialId(sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY, ctx),
                this.instanceCredentialBroker.getAssignedCredentialId(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, ctx),
            ]);
            const nextDaytonaCredentialId = daytonaCredentialId === undefined ? currentDaytonaCredentialId : daytonaCredentialId;
            const nextN8nCredentialId = n8nSandboxCredentialId === undefined ? currentN8nCredentialId : n8nSandboxCredentialId;
            const nextSearchCredentialId = searchCredentialId === undefined ? currentSearchCredentialId : searchCredentialId;
            const clearsSandboxConnection = (sandboxConnection !== undefined ||
                daytonaCredentialId !== undefined ||
                n8nSandboxCredentialId !== undefined) &&
                nextDaytonaCredentialId === null &&
                nextN8nCredentialId === null;
            const assignsSandboxConnection = (sandboxConnection !== undefined ||
                daytonaCredentialId !== undefined ||
                n8nSandboxCredentialId !== undefined) &&
                (nextDaytonaCredentialId !== null || nextN8nCredentialId !== null);
            if (assignsSandboxConnection)
                settingsUpdate.sandboxEnabled = true;
            this.validateAdminSettingsUpdate(settingsUpdate, current, clearsSandboxConnection
                ? this.environmentSandboxProvider
                : settingsUpdate.sandboxProvider);
            const previous = this.snapshotAdminSettings();
            const next = this.mergeAdminSettings(current, settingsUpdate);
            if (clearsSandboxConnection)
                delete next.sandboxProvider;
            const nextModelCredentialId = modelCredentialId === undefined ? currentModelCredentialId : modelCredentialId;
            const nextModelName = settingsUpdate.modelName !== undefined
                ? settingsUpdate.modelName
                : modelCredentialId === null
                    ? null
                    : current.modelName;
            if (modelCredentialId !== undefined || settingsUpdate.modelName !== undefined) {
                const hasCredential = nextModelCredentialId !== null && nextModelCredentialId !== undefined;
                const hasModelName = nextModelName !== null && nextModelName !== undefined;
                if (hasCredential && !hasModelName) {
                    throw new errors_1.UnprocessableRequestError('modelName must be set together with modelCredentialId');
                }
                if (hasModelName && !hasCredential && !this.hasEnvironmentModelConnection()) {
                    throw new errors_1.UnprocessableRequestError('modelName requires modelCredentialId');
                }
            }
            next.modelName = nextModelName ?? null;
            await updateCredentialAssignment(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, modelCredentialId);
            await updateCredentialAssignment(sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY, daytonaCredentialId);
            await updateCredentialAssignment(sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY, n8nSandboxCredentialId);
            await updateCredentialAssignment(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, searchCredentialId);
            if (typeof modelCredentialId === 'string') {
                await this.validateAssignedServiceCredential(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, ctx);
            }
            if (typeof daytonaCredentialId === 'string') {
                await this.validateAssignedServiceCredential(sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY, ctx);
            }
            if (typeof n8nSandboxCredentialId === 'string') {
                await this.validateAssignedServiceCredential(sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY, ctx);
            }
            if (typeof searchCredentialId === 'string') {
                await this.validateAssignedServiceCredential(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, ctx);
            }
            await this.settingsRepository.upsertByKey(ADMIN_SETTINGS_KEY, JSON.stringify(next), true, ctx);
            return {
                previous,
                next,
                credentialSelection: {
                    modelCredentialId: nextModelCredentialId ?? null,
                    modelName: next.modelName ?? null,
                    daytonaCredentialId: nextDaytonaCredentialId,
                    n8nSandboxCredentialId: nextN8nCredentialId,
                    searchCredentialId: nextSearchCredentialId,
                },
                previousSelection: {
                    modelCredentialId: currentModelCredentialId,
                    modelName: current.modelName ?? null,
                    daytonaCredentialId: currentDaytonaCredentialId,
                    n8nSandboxCredentialId: currentN8nCredentialId,
                    searchCredentialId: currentSearchCredentialId,
                },
            };
        });
        this.applyAdminSettings(next);
        this.emitSettingsUpdated(previous, next, {
            previous: previousSelection,
            next: credentialSelection,
            connectionsUpdated: {
                model: modelConnection !== undefined && modelConnection !== null,
                sandbox: sandboxConnection !== undefined && sandboxConnection !== null,
                search: searchConnection !== undefined && searchConnection !== null,
            },
        });
        return this.buildAdminSettingsResponse(credentialSelection);
    }
    rejectConnectionConflicts(update) {
        const conflicts = [
            ['modelConnection', 'modelCredentialId', update.modelCredentialId !== undefined],
            ['sandboxConnection', 'daytonaCredentialId', update.daytonaCredentialId !== undefined],
            ['sandboxConnection', 'n8nSandboxCredentialId', update.n8nSandboxCredentialId !== undefined],
            ['searchConnection', 'searchCredentialId', update.searchCredentialId !== undefined],
        ];
        for (const [connectionField, idField, idPresent] of conflicts) {
            const connectionPresent = update[connectionField] !== undefined;
            if (connectionPresent && idPresent) {
                throw new errors_1.UnprocessableRequestError(`Cannot combine ${connectionField} with ${idField} in one update`);
            }
        }
    }
    async upsertConnection(user, policy, name, connection, ctx, prepared) {
        if (connection === null)
            return null;
        if (!prepared?.encryptedData) {
            throw new n8n_workflow_1.UnexpectedError('Prepared provider connection is missing encrypted data');
        }
        let current;
        try {
            current = await this.instanceCredentialBroker.resolveForUse(policy, ctx);
        }
        catch (error) {
            if (!(error instanceof errors_1.UnprocessableRequestError))
                throw error;
            current = null;
        }
        if ((current?.id ?? null) !== prepared.expectedCredentialId ||
            current?.name !== prepared.expectedCredentialName ||
            current?.type !== prepared.expectedCredentialType ||
            (current !== null &&
                current !== undefined &&
                !(0, node_util_1.isDeepStrictEqual)(current.data, prepared.expectedCredentialData))) {
            throw new errors_1.ConflictError('Provider connection changed; retry');
        }
        const data = connection.data;
        if (current && current.type === connection.type) {
            await this.credentialsService.updateInstanceCredential(user, current.id, { name: current.name, type: current.type, data }, ctx, { skipExternalHooks: true, encryptedData: prepared.encryptedData });
            return current.id;
        }
        const dto = {
            name,
            type: connection.type,
            data: connection.data,
            usageScope: 'instance',
        };
        const created = await this.credentialsService.createInstanceCredential(dto, user, ctx, {
            skipExternalHooks: true,
            encryptedData: prepared.encryptedData,
        });
        return created.id;
    }
    async prepareConnection(policy, name, connection) {
        if (!connection)
            return undefined;
        if (!policy.credentialTypes.includes(connection.type)) {
            throw new errors_1.UnprocessableRequestError(`Connection type "${connection.type}" is not supported for "${policy.id}"`);
        }
        let current;
        try {
            current = await this.instanceCredentialBroker.resolveForUse(policy);
        }
        catch (error) {
            if (!(error instanceof errors_1.UnprocessableRequestError))
                throw error;
            current = null;
        }
        const data = current?.type === connection.type
            ? this.credentialsService.unredact(connection.data, current.data, this.credentialsService.getCredentialTypeProperties(connection.type))
            : connection.data;
        validateInstanceAiCredential(policy, { type: connection.type, data });
        const existing = current?.type === connection.type ? { id: current.id, name: current.name } : null;
        return {
            event: existing ? 'update' : 'create',
            expectedCredentialId: current?.id ?? null,
            expectedCredentialName: current?.name,
            expectedCredentialType: current?.type,
            expectedCredentialData: current?.data,
            credential: {
                id: existing?.id ?? null,
                name: existing?.name ?? name,
                type: connection.type,
                data,
            },
        };
    }
    async prepareSandboxConnection(connection) {
        if (!connection)
            return undefined;
        const policy = connection.type === 'daytonaApi'
            ? sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY
            : connection.type === 'httpHeaderAuth'
                ? sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY
                : undefined;
        if (!policy) {
            throw new errors_1.UnprocessableRequestError(`Connection type "${connection.type}" is not supported for the sandbox`);
        }
        return await this.prepareConnection(policy, 'n8n Assistant sandbox', connection);
    }
    async runConnectionHooks(preparedConnections) {
        for (const prepared of preparedConnections) {
            if (prepared) {
                prepared.encryptedData = await this.credentialsService.runInstanceCredentialHooks(prepared.event, prepared.credential);
            }
        }
    }
    async upsertSandboxConnection(user, connection, ctx, prepared) {
        const name = 'n8n Assistant sandbox';
        if (connection === null) {
            return {
                daytonaCredentialId: await this.upsertConnection(user, sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY, name, null, ctx),
                n8nSandboxCredentialId: await this.upsertConnection(user, sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY, name, null, ctx),
            };
        }
        if (connection.type === 'daytonaApi') {
            return {
                daytonaCredentialId: await this.upsertConnection(user, sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY, name, connection, ctx, prepared),
                n8nSandboxCredentialId: await this.upsertConnection(user, sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY, name, null, ctx),
                sandboxProvider: 'daytona',
            };
        }
        if (connection.type === 'httpHeaderAuth') {
            return {
                n8nSandboxCredentialId: await this.upsertConnection(user, sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY, name, connection, ctx, prepared),
                daytonaCredentialId: await this.upsertConnection(user, sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY, name, null, ctx),
                sandboxProvider: 'n8n-sandbox',
            };
        }
        throw new errors_1.UnprocessableRequestError(`Connection type "${connection.type}" is not supported for the sandbox`);
    }
    async reloadFromDb() {
        const previous = this.snapshotAdminSettings();
        const persisted = await this.readPersistedAdminSettings();
        this.applyAdminSettings(persisted);
        this.emitSettingsUpdated(previous, this.snapshotAdminSettings());
    }
    async getUserPreferences(user) {
        const prefs = this.readUserPreferences(user);
        const credentialId = prefs.credentialId ?? null;
        let credentialType = null;
        let credentialName = null;
        if (credentialId) {
            const cred = await this.credentialsFinderService.findCredentialForUser(credentialId, user, [
                'credential:read',
            ]);
            if (cred) {
                credentialType = cred.type;
                credentialName = cred.name;
            }
        }
        return {
            credentialId,
            credentialType,
            credentialName,
            modelName: prefs.modelName || this.extractModelName(this.config.model),
            localGatewayDisabled: prefs.localGatewayDisabled ?? false,
        };
    }
    async updateUserPreferences(user, update) {
        this.rejectManagedFields(update, InstanceAiSettingsService_1.MANAGED_PREFERENCE_FIELDS, this.deploymentLabel());
        const prefs = { ...this.readUserPreferences(user) };
        if (update.credentialId !== undefined)
            prefs.credentialId = update.credentialId;
        if (update.modelName !== undefined)
            prefs.modelName = update.modelName;
        if (update.localGatewayDisabled !== undefined)
            prefs.localGatewayDisabled = update.localGatewayDisabled;
        await this.userService.updateSettings(user.id, { instanceAi: prefs });
        user.settings = { ...(user.settings ?? {}), instanceAi: prefs };
        return await this.getUserPreferences(user);
    }
    async resolveModelConnectionForVerification(connection) {
        const prepared = await this.prepareConnection(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, 'n8n Assistant model', connection);
        return this.connectionForVerification(prepared);
    }
    async resolveSandboxConnectionForVerification(connection) {
        const prepared = await this.prepareSandboxConnection(connection);
        return this.connectionForVerification(prepared);
    }
    async resolveSearchConnectionForVerification(connection) {
        const prepared = await this.prepareConnection(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, 'n8n Assistant web search', connection);
        return this.connectionForVerification(prepared);
    }
    connectionForVerification(prepared) {
        if (!prepared)
            throw new n8n_workflow_1.UnexpectedError('Prepared provider connection is missing');
        return {
            type: prepared.credential.type,
            data: prepared.credential.data,
        };
    }
    async listInstanceModelCredentials() {
        if (this.isCloud || this.aiService.isProxyEnabled())
            return [];
        const instanceCredentials = await this.instanceCredentialBroker.listForUse(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY);
        return instanceCredentials.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
        }));
    }
    async listInstanceServiceCredentials() {
        if (this.isCloud)
            return [];
        const policies = this.aiService.isProxyEnabled()
            ? [sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY]
            : [
                sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY,
                sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY,
                exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY,
            ];
        const credentials = await Promise.all(policies.map(async (policy) => await this.instanceCredentialBroker.listForUse(policy)));
        return credentials.flat().map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
        }));
    }
    async resolveDaytonaConfig() {
        const { daytonaApiUrl, daytonaApiKey } = this.config;
        const envConfig = {
            apiUrl: daytonaApiUrl || undefined,
            apiKey: daytonaApiKey || undefined,
        };
        if (this.aiService.isProxyEnabled() ||
            (this.isDirectSelfManaged() &&
                this.environmentSandboxProvider === 'daytona' &&
                this.hasEnvironmentSandboxConnection())) {
            return envConfig;
        }
        return await this.sandboxSettingsService.resolveDaytonaConfig();
    }
    async resolveN8nSandboxConfig() {
        if (this.isDirectSelfManaged() &&
            this.environmentSandboxProvider === 'n8n-sandbox' &&
            this.hasEnvironmentSandboxConnection()) {
            const { n8nSandboxServiceUrl, n8nSandboxServiceApiKey } = this.config;
            return {
                serviceUrl: n8nSandboxServiceUrl || undefined,
                apiKey: n8nSandboxServiceApiKey || undefined,
            };
        }
        return await this.sandboxSettingsService.resolveN8nSandboxConfig();
    }
    async resolveSearchConfig() {
        const { braveSearchApiKey, searxngUrl } = this.config;
        const envConfig = {
            braveApiKey: braveSearchApiKey || undefined,
            searxngUrl: searxngUrl || undefined,
        };
        if (this.isDirectSelfManaged() && this.hasEnvironmentSearchConnection())
            return envConfig;
        const resolved = await this.resolveServiceCredential(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY, 'search');
        if (!resolved)
            return envConfig;
        const { type, data } = resolved;
        if (type === 'braveSearchApi' && typeof data.apiKey === 'string' && data.apiKey) {
            return { braveApiKey: data.apiKey };
        }
        if (type === 'searXngApi' && typeof data.apiUrl === 'string' && data.apiUrl) {
            return { searxngUrl: data.apiUrl };
        }
        this.warnCredentialFallback('search', exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY.id, 'Credential data is incomplete');
        return envConfig;
    }
    async validateAssignedServiceCredential(policy, ctx) {
        const resolved = await this.instanceCredentialBroker.resolveForUse(policy, ctx);
        if (!resolved)
            return;
        validateInstanceAiCredential(policy, { type: resolved.type, data: resolved.data });
    }
    async resolveServiceCredential(policy, service, ctx) {
        if (this.isCloud || this.aiService.isProxyEnabled())
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
        di_1.Container.get(backend_common_1.Logger)
            .scoped('instance-ai')
            .warn(`Could not resolve the configured ${service} credential; using environment fallback`, {
            credentialUseId,
            error: reason,
        });
    }
    getPermissions() {
        return { ...this.permissions };
    }
    getMcpToolPermissions() {
        return {
            categories: {
                read: this.permissions.mcpRead,
                write: this.permissions.mcpWrite,
            },
        };
    }
    isMcpAccessEnabled() {
        return this.mcpAccessEnabled;
    }
    async isLocalGatewayDisabledForUser(userId) {
        if (!this.enabled)
            return true;
        if (this.config.localGatewayDisabled)
            return true;
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user)
            return true;
        return this.readUserPreferences(user).localGatewayDisabled ?? false;
    }
    isAgentEnabled() {
        return this.enabled;
    }
    isLocalGatewayDisabled() {
        return this.config.localGatewayDisabled;
    }
    isBrowserUseEnabled() {
        return this.config.browserUseEnabled;
    }
    getSandboxStatus() {
        const provider = this.sandboxSettingsService.getProvider();
        const unavailableReason = this.getSandboxUnavailableReason(this.config.sandboxEnabled, provider);
        return {
            enabled: this.config.sandboxEnabled,
            provider,
            workflowBuilderAvailable: this.config.sandboxEnabled && unavailableReason === null,
            unavailableReason,
        };
    }
    isInstanceAiEnabled() {
        return this.enabled;
    }
    async isSetupCompleted() {
        if (!this.isDirectSelfManaged())
            return true;
        return (await this.resolveSetupState()).setupCompleted;
    }
    async isModelConfigured() {
        if (!this.isDirectSelfManaged())
            return true;
        return (await this.resolveSetupState()).modelSource !== 'none';
    }
    async resolveSetupState() {
        const [modelSelection, daytonaCredentialId, n8nSandboxCredentialId, searchCredentialId] = await Promise.all([
            this.readAdminModelSelection(),
            this.instanceCredentialBroker.getAssignedCredentialId(sandbox_settings_service_1.INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY),
            this.instanceCredentialBroker.getAssignedCredentialId(sandbox_settings_service_1.INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY),
            this.instanceCredentialBroker.getAssignedCredentialId(exports.INSTANCE_AI_SEARCH_CREDENTIAL_POLICY),
        ]);
        const response = this.buildAdminSettingsResponse({
            ...modelSelection,
            daytonaCredentialId,
            n8nSandboxCredentialId,
            searchCredentialId,
        });
        return (0, api_types_1.deriveInstanceAiSetupState)(response);
    }
    getConfiguredModelId() {
        return this.config.model.trim();
    }
    getConfiguredMemoryModelName() {
        return this.config.memoryModel.trim();
    }
    resolveModelName(user) {
        const prefs = this.readUserPreferences(user);
        if (this.isDirectSelfManaged() && this.hasEnvironmentModelName())
            return this.extractModelName(this.config.model);
        const adminModelName = this.isCloud || this.aiService.isProxyEnabled() ? null : this.adminModelName;
        return adminModelName ?? prefs.modelName ?? this.extractModelName(this.config.model);
    }
    async resolveModelConfig(user) {
        const prefs = this.readUserPreferences(user);
        const fallbackModelName = prefs.modelName ?? this.extractModelName(this.config.model);
        if (this.isDirectSelfManaged() && this.hasEnvironmentModelConnection())
            return this.envVarModelConfig();
        const adminModelConfig = await this.resolveAdminModelConfig();
        if (adminModelConfig) {
            return adminModelConfig;
        }
        const credentialId = prefs.credentialId ?? null;
        if (!credentialId) {
            return this.envVarModelConfig();
        }
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!credential) {
            return this.envVarModelConfig();
        }
        return ((await this.buildModelConfigFromCredential(credential, fallbackModelName)) ??
            this.envVarModelConfig());
    }
    async resolveModelConfigForVerification(user, modelName) {
        const config = await this.resolveModelConfig(user);
        if (!modelName)
            return config;
        return (0, model_config_name_1.withModelName)(config, modelName) ?? config;
    }
    buildModelConfigForConnection(connection, modelName) {
        if (!exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY.credentialTypes.includes(connection.type)) {
            throw new errors_1.UnprocessableRequestError(`Connection type "${connection.type}" is not supported for the model`);
        }
        validateModelCredential({ type: connection.type, data: connection.data });
        const config = this.buildModelConfig(connection.type, connection.data, modelName);
        if (!config) {
            throw new errors_1.UnprocessableRequestError('The model connection is incomplete');
        }
        return config;
    }
    async resolveAdminModelConfig() {
        if (this.isCloud ||
            this.aiService.isProxyEnabled() ||
            (this.isDirectSelfManaged() && this.hasEnvironmentModelConnection()))
            return null;
        return await this.withPersistedAdminSettings(async (ctx, persisted) => {
            const modelName = persisted.modelName ?? null;
            if (!modelName)
                return null;
            const resolved = await this.resolveServiceCredential(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, 'model', ctx);
            if (!resolved)
                return null;
            const config = this.buildModelConfig(resolved.type, resolved.data, modelName);
            if (!config) {
                this.warnCredentialFallback('model', exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY.id, 'Credential data is incomplete');
            }
            return config;
        });
    }
    async buildModelConfigFromCredential(credential, modelName) {
        const data = await this.credentialsService.decrypt(credential, true);
        return this.buildModelConfig(credential.type, data, modelName);
    }
    buildModelConfig(credentialType, data, modelName) {
        const credentialProvider = exports.CREDENTIAL_TO_MODEL_PROVIDER[credentialType];
        if (!credentialProvider) {
            return null;
        }
        const apiKey = typeof data.apiKey === 'string' ? data.apiKey : '';
        const urlField = URL_FIELD_MAP[credentialType];
        const rawUrl = urlField ? data[urlField] : undefined;
        const baseUrl = typeof rawUrl === 'string' ? rawUrl : '';
        const provider = credentialType === 'openAiApi' && baseUrl && (0, model_discovery_1.isOpenAiCustomEndpoint)(baseUrl)
            ? 'custom'
            : credentialProvider;
        const id = `${provider}/${modelName}`;
        if (!baseUrl && !apiKey)
            return null;
        const headers = modelCredentialHeaders(credentialType, data);
        return {
            id,
            url: baseUrl,
            ...(apiKey ? { apiKey } : {}),
            ...(headers ? { headers } : {}),
            ...this.customModelOptionsFor(id),
        };
    }
    rejectEnvironmentManagedFields(update) {
        if (!this.isDirectSelfManaged())
            return;
        const managedFields = [];
        if (this.hasEnvironmentModelConnection()) {
            managedFields.push('modelCredentialId', 'modelConnection');
        }
        if (this.hasEnvironmentModelName())
            managedFields.push('modelName');
        if (this.hasEnvironmentSandboxConnection()) {
            managedFields.push('sandboxProvider', 'daytonaCredentialId', 'n8nSandboxCredentialId', 'sandboxConnection', 'n8nSandboxServiceUrl');
        }
        if (this.hasEnvironmentSearchConnection()) {
            managedFields.push('searchCredentialId', 'searchConnection', 'searchDisabled');
        }
        this.rejectManagedFields(update, managedFields, 'environment');
    }
    deploymentLabel() {
        if (this.isCloud)
            return 'cloud';
        if (this.aiService.isProxyEnabled())
            return 'proxy';
        return 'instance';
    }
    rejectManagedFields(update, managedFields, label) {
        const record = update;
        const present = managedFields.filter((key) => key in record && record[key] !== undefined);
        if (present.length > 0) {
            throw new errors_1.UnprocessableRequestError(`Cannot update ${label}-managed fields: ${present.join(', ')}`);
        }
    }
    validateAdminSettingsUpdate(update, current, sandboxProviderOverride) {
        const touchesSandboxSettings = update.sandboxEnabled !== undefined ||
            update.sandboxProvider !== undefined ||
            update.n8nSandboxServiceUrl !== undefined ||
            update.sandboxImage !== undefined ||
            update.sandboxTimeout !== undefined ||
            update.daytonaCredentialId !== undefined ||
            update.n8nSandboxCredentialId !== undefined ||
            update.sandboxConnection !== undefined;
        if (!touchesSandboxSettings)
            return;
        const sandboxProvider = (0, sandbox_provider_1.normalizeSandboxProvider)(sandboxProviderOverride ??
            update.sandboxProvider ??
            current.sandboxProvider ??
            this.environmentSandboxProvider);
        const sandboxEnabled = update.sandboxEnabled ?? current.sandboxEnabled ?? false;
        const sandboxServiceUrl = this.environmentN8nSandboxServiceUrl ||
            update.n8nSandboxServiceUrl ||
            current.n8nSandboxServiceUrl ||
            '';
        const unavailableReason = this.getSandboxUnavailableReason(sandboxEnabled, sandboxProvider, sandboxServiceUrl);
        if (unavailableReason)
            throw new errors_1.UnprocessableRequestError(unavailableReason);
    }
    getSandboxUnavailableReason(sandboxEnabled, sandboxProvider, sandboxServiceUrl = this.config.n8nSandboxServiceUrl) {
        if (sandboxEnabled &&
            sandboxProvider === 'n8n-sandbox' &&
            sandboxServiceUrl.trim().length === 0) {
            return sandbox_provider_1.N8N_SANDBOX_SERVICE_URL_REQUIRED_MESSAGE;
        }
        return null;
    }
    envVarModelConfig() {
        const configuredModel = this.config.model;
        if (this.hasEnvironmentModelName() || !this.adminModelName)
            return this.envVarModelConfigForModel(configuredModel);
        const slash = configuredModel.indexOf('/');
        const provider = slash >= 0 ? configuredModel.slice(0, slash) : 'custom';
        return this.envVarModelConfigForModel(`${provider}/${this.adminModelName}`);
    }
    hasEnvironmentModelConnection() {
        const provider = this.config.model.split('/', 1)[0] ?? '';
        if (provider === 'google-vertex-anthropic') {
            return Boolean(this.resolveVertexProjectId());
        }
        const providerApiKeyEnv = MODEL_PROVIDER_API_KEY_ENV.get(provider);
        return Boolean(this.config.modelApiKey.trim() ||
            this.config.modelUrl.trim() ||
            (providerApiKeyEnv && process.env[providerApiKeyEnv]?.trim()));
    }
    hasEnvironmentModelName() {
        return Boolean(process.env.N8N_INSTANCE_AI_MODEL?.trim());
    }
    hasEnvironmentSandboxConnection() {
        if (this.environmentSandboxProvider === 'daytona') {
            return this.aiService.isProxyEnabled() || Boolean(this.config.daytonaApiKey.trim());
        }
        return Boolean(this.environmentN8nSandboxServiceUrl.trim());
    }
    hasEnvironmentSearchConnection() {
        return Boolean(this.config.braveSearchApiKey.trim() || this.config.searxngUrl.trim());
    }
    isDirectSelfManaged() {
        return !this.isCloud && !this.aiService.isProxyEnabled();
    }
    envVarModelConfigForModel(model) {
        const { modelUrl, modelApiKey } = this.config;
        const id = model.includes('/')
            ? model
            : `custom/${model}`;
        const customOptions = this.customModelOptionsFor(id);
        const vertexConfig = this.vertexAnthropicModelConfig(id);
        if (vertexConfig)
            return vertexConfig;
        if (modelUrl) {
            return {
                id,
                url: modelUrl,
                ...(modelApiKey ? { apiKey: modelApiKey } : {}),
                ...customOptions,
            };
        }
        if (modelApiKey) {
            return {
                id,
                url: '',
                apiKey: modelApiKey,
                ...customOptions,
            };
        }
        return model;
    }
    resolveVertexProjectId() {
        return (this.config.vertexProjectId?.trim() ||
            process.env.GOOGLE_VERTEX_PROJECT?.trim() ||
            projectIdFromServiceAccountJson(this.config.vertexServiceAccountJson) ||
            '');
    }
    resolveVertexLocation() {
        return (this.config.vertexLocation?.trim() || process.env.GOOGLE_VERTEX_LOCATION?.trim() || 'global');
    }
    vertexAnthropicModelConfig(id) {
        if (!isVertexAnthropicModelId(id))
            return null;
        const googleCredentials = this.config.vertexServiceAccountJson?.trim() || undefined;
        return {
            id,
            project: this.resolveVertexProjectId(),
            location: this.resolveVertexLocation(),
            ...(googleCredentials ? { googleCredentials } : {}),
        };
    }
    customModelOptionsFor(modelId) {
        if (!modelId.startsWith('custom/'))
            return {};
        const { supportsStructuredOutputs } = (0, instance_ai_1.resolveCustomModelExperimentDefaultsFromEnv)(modelId);
        return supportsStructuredOutputs !== undefined ? { supportsStructuredOutputs } : {};
    }
    extractModelName(model) {
        const slash = model.indexOf('/');
        return slash >= 0 ? model.slice(slash + 1) : model;
    }
    applyAdminSettings(persisted) {
        const c = this.config;
        if (persisted.enabled !== undefined)
            this.enabled = persisted.enabled;
        if (persisted.permissions) {
            this.permissions = (0, api_types_1.resolveInstanceAiPermissions)(persisted.permissions);
        }
        if (persisted.mcpServers !== undefined)
            c.mcpServers = persisted.mcpServers;
        if (persisted.mcpAccessEnabled !== undefined)
            this.mcpAccessEnabled = persisted.mcpAccessEnabled;
        if (persisted.sandboxEnabled !== undefined)
            c.sandboxEnabled = persisted.sandboxEnabled;
        this.sandboxProviderOverride =
            this.isCloud ||
                (this.isDirectSelfManaged() && this.hasEnvironmentSandboxConnection()) ||
                !persisted.sandboxProvider
                ? undefined
                : (0, sandbox_provider_1.normalizeSandboxProvider)(persisted.sandboxProvider);
        c.sandboxProvider = this.sandboxProviderOverride ?? this.environmentSandboxProvider;
        if (persisted.sandboxImage !== undefined)
            c.sandboxImage = persisted.sandboxImage;
        if (persisted.sandboxTimeout !== undefined)
            c.sandboxTimeout = persisted.sandboxTimeout;
        if (persisted.modelName !== undefined)
            this.adminModelName = persisted.modelName;
        if (persisted.searchDisabled !== undefined)
            this.searchDisabled =
                this.isDirectSelfManaged() && this.hasEnvironmentSearchConnection()
                    ? false
                    : persisted.searchDisabled;
        if (persisted.n8nSandboxServiceUrl !== undefined) {
            this.adminN8nSandboxServiceUrl = persisted.n8nSandboxServiceUrl;
            this.config.n8nSandboxServiceUrl =
                this.environmentN8nSandboxServiceUrl || persisted.n8nSandboxServiceUrl || '';
        }
        if (persisted.localGatewayDisabled !== undefined)
            c.localGatewayDisabled = persisted.localGatewayDisabled;
        if (persisted.browserUseEnabled !== undefined)
            c.browserUseEnabled = persisted.browserUseEnabled;
    }
    readUserPreferences(user) {
        return user.settings?.instanceAi ?? {};
    }
    snapshotAdminSettings() {
        const c = this.config;
        return {
            enabled: this.enabled,
            permissions: this.permissions,
            mcpServers: c.mcpServers,
            mcpAccessEnabled: this.mcpAccessEnabled,
            sandboxEnabled: c.sandboxEnabled,
            ...(this.sandboxProviderOverride ? { sandboxProvider: this.sandboxProviderOverride } : {}),
            sandboxImage: c.sandboxImage,
            sandboxTimeout: c.sandboxTimeout,
            modelName: this.adminModelName,
            searchDisabled: this.searchDisabled,
            n8nSandboxServiceUrl: this.adminN8nSandboxServiceUrl,
            localGatewayDisabled: c.localGatewayDisabled,
            browserUseEnabled: c.browserUseEnabled,
        };
    }
    mergeAdminSettings(base, update) {
        return {
            ...base,
            ...update,
            permissions: update.permissions
                ? { ...(base.permissions ?? api_types_1.DEFAULT_INSTANCE_AI_PERMISSIONS), ...update.permissions }
                : base.permissions,
        };
    }
    async readPersistedAdminSettings() {
        const row = await this.settingsRepository.findByKey(ADMIN_SETTINGS_KEY);
        return this.parsePersistedAdminSettings(row?.value);
    }
    async withPersistedAdminSettings(read) {
        return await this.dbLockService.withLockContext(1007, async (ctx) => {
            const row = await this.settingsRepository.findByKeyInContext(ADMIN_SETTINGS_KEY, ctx);
            return await read(ctx, this.parsePersistedAdminSettings(row?.value));
        });
    }
    async readAdminModelSelection() {
        return await this.withPersistedAdminSettings(async (ctx, persisted) => ({
            modelCredentialId: await this.instanceCredentialBroker.getAssignedCredentialId(exports.INSTANCE_AI_MODEL_CREDENTIAL_POLICY, ctx),
            modelName: persisted.modelName ?? null,
        }));
    }
    parsePersistedAdminSettings(value) {
        if (value === undefined)
            return {};
        const settings = (0, n8n_workflow_1.jsonParse)(value, { fallbackValue: {} });
        delete settings.modelCredentialId;
        delete settings.daytonaCredentialId;
        delete settings.n8nSandboxCredentialId;
        delete settings.searchCredentialId;
        return settings;
    }
    emitSettingsUpdated(previous, current, credentialSelections) {
        try {
            this.eventService.emit('instance-ai-settings-updated', {
                mcpSettingsChanged: current.mcpServers !== previous.mcpServers ||
                    current.mcpAccessEnabled !== previous.mcpAccessEnabled ||
                    current.permissions?.mcpRead !== previous.permissions?.mcpRead ||
                    current.permissions?.mcpWrite !== previous.permissions?.mcpWrite,
                credentialSelections,
            });
        }
        catch (error) {
            di_1.Container.get(backend_common_1.Logger)
                .scoped('instance-ai')
                .warn('Failed to apply local settings event', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
};
exports.InstanceAiSettingsService = InstanceAiSettingsService;
InstanceAiSettingsService.MANAGED_ADMIN_FIELDS = [
    'mcpServers',
    'sandboxImage',
    'sandboxTimeout',
];
InstanceAiSettingsService.INSTANCE_CREDENTIAL_FIELDS = [
    'modelCredentialId',
    'daytonaCredentialId',
    'n8nSandboxCredentialId',
    'searchCredentialId',
    'modelConnection',
    'sandboxConnection',
    'searchConnection',
];
InstanceAiSettingsService.MANAGED_PREFERENCE_FIELDS = [
    'credentialId',
    'modelName',
];
exports.InstanceAiSettingsService = InstanceAiSettingsService = InstanceAiSettingsService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, db_1.DbLockService, db_1.SettingsRepository, db_1.UserRepository, user_service_1.UserService, ai_service_1.AiService, credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService, instance_credential_broker_1.InstanceCredentialBroker, sandbox_settings_service_1.SandboxSettingsService, backend_services_1.EventService])
], InstanceAiSettingsService);
//# sourceMappingURL=instance-ai-settings.service.js.map