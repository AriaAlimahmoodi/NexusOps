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
var AiGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGatewayService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_2 = require("../constants");
const feature_not_licensed_error_1 = require("../errors/feature-not-licensed.error");
const errors_1 = require("@n8n/errors");
const license_1 = require("../license");
const ai_gateway_eligibility_1 = require("../services/ai-gateway-eligibility");
const ownership_service_1 = require("../services/ownership.service");
const backend_services_1 = require("@n8n/backend-services");
let AiGatewayService = AiGatewayService_1 = class AiGatewayService {
    constructor(globalConfig, license, licenseState, instanceSettings, ownershipService, userRepository, urlService, outboundHttp) {
        this.globalConfig = globalConfig;
        this.license = license;
        this.licenseState = licenseState;
        this.instanceSettings = instanceSettings;
        this.ownershipService = ownershipService;
        this.userRepository = userRepository;
        this.urlService = urlService;
        this.outboundHttp = outboundHttp;
        this.tokenCache = new Map();
        this.TOKEN_CACHE_MAX_SIZE = 500;
        this.pendingTokenRequests = new Map();
        this.gatewayConfig = null;
        this.configFetchedAt = 0;
        this.configFetchFailedAt = 0;
    }
    isEnabled() {
        return (this.licenseState.isAiGatewayLicensed() &&
            this.globalConfig.aiGateway.enabled &&
            !!this.globalConfig.aiAssistant.baseUrl);
    }
    assertEnabled() {
        if (!this.isEnabled()) {
            throw new errors_1.BadRequestError('Gateway credits are not enabled on this instance');
        }
    }
    async gatewayRequest(options, errorMessage) {
        const response = await this.outboundHttp
            .requests({
            useDefaultSsrfPolicy: 'unsafe',
        })
            .request({
            method: options.method,
            url: options.url,
            ...(options.headers ? { headers: options.headers } : {}),
            ...(options.body !== undefined ? { body: options.body, json: true } : {}),
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new n8n_workflow_1.UserError(`${errorMessage}: HTTP ${response.statusCode}`);
        }
        return response.body;
    }
    async resolveUserId({ userId, projectId, workflowId, }) {
        if (userId)
            return userId;
        const resolvedProjectId = await this.resolveProjectId({ projectId, workflowId });
        const owner = resolvedProjectId
            ? await this.ownershipService.getPersonalProjectOwnerCached(resolvedProjectId)
            : null;
        if (owner)
            return owner.id;
        try {
            return (await this.ownershipService.getInstanceOwner()).id;
        }
        catch {
            return undefined;
        }
    }
    async resolveProjectId({ projectId, workflowId, }) {
        if (projectId)
            return projectId;
        if (!workflowId)
            return undefined;
        try {
            return (await this.ownershipService.getWorkflowProjectCached(workflowId)).id;
        }
        catch {
            return undefined;
        }
    }
    async getSyntheticCredential({ credentialType, userId, workflowId, projectId, executionId, agentId, node, }) {
        if (!this.licenseState.isAiGatewayLicensed()) {
            throw new feature_not_licensed_error_1.FeatureNotLicensedError(constants_1.LICENSE_FEATURES.AI_GATEWAY);
        }
        if (!this.isEnabled()) {
            throw new n8n_workflow_1.UserError('Gateway credits are not enabled on this instance.');
        }
        const baseUrl = this.requireBaseUrl();
        const config = await this.getGatewayConfig();
        const providerConfig = config.providerConfig[credentialType];
        if (!providerConfig) {
            throw new n8n_workflow_1.UserError(`Credential type "${credentialType}" is not supported by Gateway credits.`);
        }
        if (node) {
            const eligibility = (0, ai_gateway_eligibility_1.checkAiGatewayEligibility)(node, credentialType, config);
            if (!eligibility.eligible) {
                throw new n8n_workflow_1.UserError(`Gateway credits eligibility check failed: ${eligibility.reason}${eligibility.details ? ` (${eligibility.details})` : ''}.`);
            }
        }
        const resolvedProjectId = await this.resolveProjectId({ projectId, workflowId });
        const resolvedUserId = await this.resolveUserId({
            userId,
            projectId: resolvedProjectId,
            workflowId,
        });
        if (!resolvedUserId) {
            throw new n8n_workflow_1.UserError('Failed to resolve user for Gateway credits attribution.');
        }
        const jwt = await this.getOrFetchToken(resolvedUserId);
        if (!jwt) {
            throw new n8n_workflow_1.UserError('Failed to obtain a valid Gateway credits token.');
        }
        const urlFields = this.buildUrlFields(baseUrl, providerConfig, {
            executionId,
            workflowId,
            projectId: resolvedProjectId,
            agentId,
        });
        return {
            [providerConfig.apiKeyField]: jwt,
            ...urlFields,
        };
    }
    buildUrlFields(baseUrl, providerConfig, context) {
        const routing = providerConfig.routing;
        if (routing && Object.keys(routing).length > 0) {
            return Object.fromEntries(Object.entries(routing).map(([urlField, gatewayPath]) => [
                urlField,
                this.buildGatewayUrl(baseUrl, gatewayPath, context),
            ]));
        }
        return {
            [providerConfig.urlField]: this.buildGatewayUrl(baseUrl, providerConfig.gatewayPath, context),
        };
    }
    async getUsage(userId, offset, limit) {
        const baseUrl = this.requireBaseUrl();
        const jwt = await this.getOrFetchToken(userId);
        if (!jwt) {
            throw new n8n_workflow_1.UserError('Failed to obtain a valid Gateway credits token.');
        }
        const url = new URL(`${baseUrl}/v1/gateway/usage`);
        url.searchParams.set('offset', String(offset));
        url.searchParams.set('limit', String(limit));
        const data = await this.gatewayRequest({
            method: 'GET',
            url: url.toString(),
            headers: { Authorization: `Bearer ${jwt}` },
        }, 'Failed to fetch AI Gateway usage');
        if (!Array.isArray(data.entries) || typeof data.total !== 'number') {
            throw new n8n_workflow_1.UserError('Gateway credits returned an invalid usage response.');
        }
        return data;
    }
    async getWallet(userId) {
        const baseUrl = this.requireBaseUrl();
        const jwt = await this.getOrFetchToken(userId);
        if (!jwt) {
            throw new n8n_workflow_1.UserError('Failed to obtain a valid Gateway credits token.');
        }
        const data = await this.gatewayRequest({
            method: 'GET',
            url: `${baseUrl}/v1/gateway/wallet`,
            headers: { Authorization: `Bearer ${jwt}` },
        }, 'Failed to fetch AI Gateway wallet');
        return this.parseWalletResponse(data);
    }
    parseWalletResponse(data) {
        const d = data;
        if (typeof d.budget !== 'number' || typeof d.balance !== 'number') {
            throw new n8n_workflow_1.UserError('Gateway credits returned an invalid wallet response.');
        }
        return {
            budget: d.budget,
            balance: d.balance,
            hasEverToppedUp: d.hasEverToppedUp === true,
        };
    }
    buildGatewayUrl(baseUrl, gatewayPath, context) {
        const execId = context.workflowId ? context.executionId : context.agentId && 'agent';
        const attributionId = context.workflowId ?? context.agentId;
        if (execId && attributionId) {
            if (!gatewayPath.startsWith(AiGatewayService_1.GATEWAY_PATH_PREFIX)) {
                return `${baseUrl}${gatewayPath}`;
            }
            const providerSuffix = gatewayPath.slice(AiGatewayService_1.GATEWAY_PATH_PREFIX.length);
            const contextSegment = encodeURIComponent([attributionId, context.projectId].filter(Boolean).join('|'));
            return `${baseUrl}${AiGatewayService_1.GATEWAY_PATH_PREFIX}/exec/${encodeURIComponent(execId)}/${contextSegment}${providerSuffix}`;
        }
        return `${baseUrl}${gatewayPath}`;
    }
    requireBaseUrl() {
        const url = this.globalConfig.aiAssistant.baseUrl;
        if (!url)
            throw new n8n_workflow_1.UserError('Gateway credits are not configured. Set the AI assistant base URL.');
        return url;
    }
    isConfigStale() {
        return (this.gatewayConfig === null ||
            Date.now() - this.configFetchedAt > AiGatewayService_1.CONFIG_TTL_MS);
    }
    async isAvailable() {
        if (!this.isEnabled())
            return { available: false };
        try {
            const config = await this.getGatewayConfig();
            return { available: true, config };
        }
        catch {
            return { available: false };
        }
    }
    async getGatewayConfig() {
        if (!this.isConfigStale())
            return this.gatewayConfig;
        if (this.configFetchFailedAt > 0 &&
            Date.now() - this.configFetchFailedAt < AiGatewayService_1.CONFIG_FAILURE_TTL_MS) {
            throw new n8n_workflow_1.OperationalError('Gateway credits config fetch recently failed; retry is throttled.');
        }
        const baseUrl = this.requireBaseUrl();
        try {
            const data = await this.gatewayRequest({
                method: 'GET',
                url: `${baseUrl}/v1/gateway/config`,
            }, 'Failed to fetch AI Gateway config');
            const parsed = api_types_1.AiGatewayConfigDto.safeParse(data);
            if (!parsed.success) {
                throw new n8n_workflow_1.UserError('Gateway credits returned an invalid config response.');
            }
            this.gatewayConfig = parsed.data;
            this.configFetchedAt = Date.now();
            this.configFetchFailedAt = 0;
            return parsed.data;
        }
        catch (error) {
            this.configFetchFailedAt = Date.now();
            throw error;
        }
    }
    async getCredentialTypeForProvider(provider) {
        if (!this.isEnabled())
            return undefined;
        const config = await this.getGatewayConfig();
        return AiGatewayService_1.matchCredentialTypeForProvider(config, provider);
    }
    getCredentialTypeForProviderCached(provider) {
        if (!this.isEnabled())
            return null;
        if (!this.gatewayConfig)
            return undefined;
        return AiGatewayService_1.matchCredentialTypeForProvider(this.gatewayConfig, provider) ?? null;
    }
    static matchCredentialTypeForProvider(config, provider) {
        return (0, api_types_1.getAgentModelProviderCredentialTypes)(provider).find((credentialType) => config.providerConfig[credentialType] !== undefined);
    }
    buildGatewayCredentialsHeaders(userId) {
        const headers = {};
        headers['Content-Type'] = 'application/json';
        headers['x-user-id'] = userId;
        headers['x-consumer-id'] = this.license.getConsumerId();
        headers['x-sdk-version'] = constants_2.AI_ASSISTANT_SDK_VERSION;
        headers['x-n8n-version'] = constants_2.N8N_VERSION;
        headers['x-instance-id'] = this.instanceSettings.instanceId;
        return headers;
    }
    async getOrFetchToken(userId) {
        const key = `${this.instanceSettings.instanceId}:${userId}`;
        const cached = this.tokenCache.get(key);
        if (cached && cached.refreshAt > Date.now()) {
            return cached.token;
        }
        const pending = this.pendingTokenRequests.get(key);
        if (pending)
            return await pending;
        const promise = this.fetchAndCacheToken(userId, key);
        this.pendingTokenRequests.set(key, promise);
        try {
            return await promise;
        }
        finally {
            this.pendingTokenRequests.delete(key);
        }
    }
    async fetchAndCacheToken(userId, key) {
        const baseUrl = this.requireBaseUrl();
        const [licenseCert, user] = await Promise.all([
            this.license.loadCertStr(),
            this.userRepository.findOneBy({ id: userId }),
        ]);
        const { token, expiresIn } = await this.gatewayRequest({
            method: 'POST',
            url: `${baseUrl}/v1/gateway/credentials`,
            headers: this.buildGatewayCredentialsHeaders(userId),
            body: {
                licenseCert,
                ...(user?.email && { userEmail: user.email }),
                ...(user && {
                    userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
                }),
                instanceUrl: this.urlService.getInstanceBaseUrl(),
            },
        }, 'Failed to fetch AI Gateway token');
        if (!token || typeof expiresIn !== 'number') {
            throw new n8n_workflow_1.UserError('Gateway credits returned an invalid token response.');
        }
        if (this.tokenCache.size >= this.TOKEN_CACHE_MAX_SIZE) {
            this.tokenCache.delete(this.tokenCache.keys().next().value);
        }
        const lifetimeMs = expiresIn * 1000;
        this.tokenCache.set(key, {
            token,
            expiresAt: Date.now() + lifetimeMs,
            refreshAt: Date.now() + lifetimeMs * 0.9,
        });
        return token;
    }
};
exports.AiGatewayService = AiGatewayService;
AiGatewayService.CONFIG_TTL_MS = 60 * 60 * 1000;
AiGatewayService.CONFIG_FAILURE_TTL_MS = 60 * 1000;
AiGatewayService.GATEWAY_PATH_PREFIX = '/v1/gateway';
exports.AiGatewayService = AiGatewayService = AiGatewayService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, license_1.License, backend_common_1.LicenseState, n8n_core_1.InstanceSettings, ownership_service_1.OwnershipService, db_1.UserRepository, backend_services_1.UrlService, backend_network_1.OutboundHttp])
], AiGatewayService);
//# sourceMappingURL=ai-gateway.service.js.map