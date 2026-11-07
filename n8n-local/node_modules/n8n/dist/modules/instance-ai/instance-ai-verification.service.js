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
exports.InstanceAiVerificationService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sanitize_error_detail_1 = require("@n8n/utils/redaction/sanitize-error-detail");
const telemetry_2 = require("../../telemetry");
const ai_proxy_fetch_1 = require("../../utils/ai-proxy-fetch");
const instance_ai_model_service_1 = require("./instance-ai-model.service");
const instance_ai_settings_service_1 = require("./instance-ai-settings.service");
const VERIFICATION_TIMEOUT_MS = 30_000;
const MAX_ERROR_MESSAGE_LENGTH = 512;
const VERIFICATION_MAX_OUTPUT_TOKENS = 16;
function sanitizeVerificationError(error) {
    return (0, sanitize_error_detail_1.sanitizeErrorDetail)((0, ensure_error_1.ensureError)(error).message, MAX_ERROR_MESSAGE_LENGTH);
}
function modelProviderOf(config) {
    if (typeof config === 'string')
        return config.split('/', 1)[0] || null;
    if (typeof config !== 'object')
        return null;
    if ('id' in config && typeof config.id === 'string') {
        return config.id.split('/', 1)[0] || null;
    }
    if ('provider' in config && typeof config.provider === 'string') {
        return config.provider.split('.', 1)[0] || null;
    }
    return null;
}
function numericStatus(error) {
    if (typeof error !== 'object' || error === null)
        return undefined;
    for (const key of ['status', 'statusCode', 'code']) {
        const value = Reflect.get(error, key);
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string' && /^\d{3}$/.test(value))
            return Number(value);
    }
    return undefined;
}
function classifyFailure(error) {
    const status = numericStatus(error);
    if (status === 401)
        return 'unauthorized';
    if (status === 403) {
        const message = (0, ensure_error_1.ensureError)(error).message.toLowerCase();
        return message.includes('quota') || message.includes('limit') ? 'quota_exceeded' : 'forbidden';
    }
    if (status === 429)
        return 'rate_limited';
    const errorObject = (0, ensure_error_1.ensureError)(error);
    if (errorObject.name === 'AbortError' || errorObject.name === 'TimeoutError')
        return 'timeout';
    const message = errorObject.message.toLowerCase();
    if (/\b401\b/.test(message))
        return 'unauthorized';
    if (/\b403\b/.test(message)) {
        return message.includes('quota') || message.includes('limit') ? 'quota_exceeded' : 'forbidden';
    }
    if (/\b429\b/.test(message))
        return 'rate_limited';
    if (message.includes('timeout') || message.includes('timed out'))
        return 'timeout';
    if (message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('fetch failed') ||
        message.includes('network'))
        return 'unreachable';
    if (message.includes('json') || message.includes('response'))
        return 'invalid_response';
    return 'provider_error';
}
function connectionString(connection, field) {
    const value = connection?.data[field];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
let InstanceAiVerificationService = class InstanceAiVerificationService {
    constructor(logger, globalConfig, settingsService, modelService, outboundHttp, telemetry) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.settingsService = settingsService;
        this.modelService = modelService;
        this.outboundHttp = outboundHttp;
        this.telemetry = telemetry;
    }
    async verifyModel(user, request) {
        let provider = null;
        try {
            const connection = request.connection
                ? await this.settingsService.resolveModelConnectionForVerification(request.connection)
                : undefined;
            const modelConfig = connection
                ? this.settingsService.buildModelConfigForConnection(connection, request.modelName ?? '')
                : request.modelName
                    ? await this.settingsService.resolveModelConfigForVerification(user, request.modelName)
                    : await this.modelService.resolveAgentModelConfig(user);
            provider =
                !connection && !request.modelName && this.settingsService.isProxyEnabled()
                    ? this.settingsService.getConfiguredModelId().split('/', 1)[0] || null
                    : modelProviderOf(modelConfig);
            const { createModel } = await import('@n8n/agents');
            const { generateText } = await import('ai');
            const startedAt = performance.now();
            await generateText({
                model: createModel(modelConfig, (0, ai_proxy_fetch_1.createAiProxyFetch)(this.outboundHttp)),
                prompt: 'Reply with OK.',
                maxOutputTokens: VERIFICATION_MAX_OUTPUT_TOKENS,
                abortSignal: AbortSignal.timeout(VERIFICATION_TIMEOUT_MS),
            });
            return { ok: true, latencyMs: Math.round(performance.now() - startedAt) };
        }
        catch (error) {
            const failure = classifyFailure(error);
            this.logVerificationFailure('model', failure, error, provider);
            return { ok: false, failure, error: sanitizeVerificationError(error) };
        }
    }
    async verifySandbox(user, request) {
        const provider = request.provider ?? this.globalConfig.instanceAi.sandboxProvider;
        let abortSignal;
        let raceWithAbort;
        let workspace;
        try {
            const config = await this.resolveSandboxConfig(user, request);
            abortSignal = AbortSignal.timeout(config.timeout ?? VERIFICATION_TIMEOUT_MS);
            const [instanceAi, agents] = await Promise.all([
                import('@n8n/instance-ai'),
                import('@n8n/agents'),
            ]);
            const { createSandbox, createWorkspace } = instanceAi;
            raceWithAbort = agents.raceWithAbort;
            const startedAt = performance.now();
            const sandbox = await raceWithAbort(async () => await createSandbox(config), abortSignal);
            if (!sandbox)
                throw new Error('Sandbox did not start');
            const activeWorkspace = createWorkspace(sandbox);
            if (!activeWorkspace)
                throw new Error('Sandbox workspace did not start');
            workspace = activeWorkspace;
            await raceWithAbort(async () => await activeWorkspace.init(), abortSignal);
            const startupMs = Math.round(performance.now() - startedAt);
            const result = await raceWithAbort(async () => await activeWorkspace.sandbox?.executeCommand?.('printf', ['ok'], { abortSignal }), abortSignal);
            if (!result || result.exitCode !== 0)
                throw new Error('Sandbox command failed');
            return { ok: true, startupMs };
        }
        catch (error) {
            const classifiedFailure = classifyFailure(error);
            const failure = provider === 'daytona' && classifiedFailure === 'forbidden'
                ? 'quota_exceeded'
                : classifiedFailure;
            this.logVerificationFailure('sandbox', failure, error, provider, { provider });
            return {
                ok: false,
                failure,
                error: sanitizeVerificationError(error),
            };
        }
        finally {
            if (workspace) {
                const cleanup = workspace.destroy().catch((error) => {
                    this.logger.warn('Instance AI sandbox verification cleanup failed', {
                        error: (0, ensure_error_1.ensureError)(error).message,
                        provider,
                    });
                });
                if (!abortSignal || abortSignal.aborted || !raceWithAbort) {
                    void cleanup;
                }
                else {
                    await raceWithAbort(cleanup, abortSignal).catch(() => { });
                }
            }
        }
    }
    async verifySearch(request) {
        let provider = null;
        try {
            const connection = request.connection
                ? await this.settingsService.resolveSearchConnectionForVerification(request.connection)
                : undefined;
            const saved = connection ? undefined : await this.settingsService.resolveSearchConfig();
            const braveApiKey = connectionString(connection, 'apiKey') ?? saved?.braveApiKey;
            const searxngUrl = connectionString(connection, 'apiUrl') ?? saved?.searxngUrl;
            provider = braveApiKey ? 'brave' : searxngUrl ? 'searxng' : null;
            const { braveSearch, searxngSearch } = await import('@n8n/ai-utilities');
            const options = {
                maxResults: 10,
                abortSignal: AbortSignal.timeout(VERIFICATION_TIMEOUT_MS),
            };
            const result = braveApiKey
                ? await braveSearch(braveApiKey, 'n8n workflow automation', options)
                : searxngUrl
                    ? await searxngSearch(searxngUrl, 'n8n workflow automation', options)
                    : undefined;
            if (!result)
                throw new Error('Search provider is not configured');
            return { ok: true, resultCount: result.results.length };
        }
        catch (error) {
            const failure = classifyFailure(error);
            this.logVerificationFailure('search', failure, error, provider);
            return { ok: false, failure, error: sanitizeVerificationError(error) };
        }
    }
    logVerificationFailure(kind, failure, error, provider, context = {}) {
        this.logger.warn(`Instance AI ${kind} verification failed`, {
            ...context,
            error: (0, ensure_error_1.ensureError)(error).message,
            failure,
        });
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.INSTANCE_AI.AI_ASSISTANT_CONNECTION_FAILED, {
            component: kind === 'search' ? 'web_search' : kind,
            provider,
            failure,
            error_message: sanitizeVerificationError(error),
        });
    }
    async resolveSandboxConfig(_user, request) {
        const instanceAi = this.globalConfig.instanceAi;
        const provider = request.provider ?? instanceAi.sandboxProvider;
        const connection = request.connection
            ? await this.settingsService.resolveSandboxConnectionForVerification(request.connection)
            : undefined;
        if (provider === 'daytona') {
            const saved = connection ? undefined : await this.settingsService.resolveDaytonaConfig();
            return {
                enabled: true,
                provider: 'daytona',
                daytonaApiUrl: connectionString(connection, 'apiUrl') ?? saved?.apiUrl ?? instanceAi.daytonaApiUrl,
                daytonaApiKey: connectionString(connection, 'apiKey') ?? saved?.apiKey ?? instanceAi.daytonaApiKey,
                image: instanceAi.sandboxImage,
                timeout: instanceAi.sandboxTimeout,
                ephemeral: true,
            };
        }
        const saved = connection ? undefined : await this.settingsService.resolveN8nSandboxConfig();
        return {
            enabled: true,
            provider: 'n8n-sandbox',
            serviceUrl: request.serviceUrl ?? saved?.serviceUrl ?? instanceAi.n8nSandboxServiceUrl,
            apiKey: connectionString(connection, 'value') ??
                saved?.apiKey ??
                instanceAi.n8nSandboxServiceApiKey,
            timeout: instanceAi.sandboxTimeout,
            ephemeral: true,
        };
    }
};
exports.InstanceAiVerificationService = InstanceAiVerificationService;
exports.InstanceAiVerificationService = InstanceAiVerificationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, instance_ai_settings_service_1.InstanceAiSettingsService, instance_ai_model_service_1.InstanceAiModelService, backend_network_1.OutboundHttp, telemetry_2.Telemetry])
], InstanceAiVerificationService);
//# sourceMappingURL=instance-ai-verification.service.js.map