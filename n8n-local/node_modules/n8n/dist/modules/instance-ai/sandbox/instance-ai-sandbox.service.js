"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiSandboxService = void 0;
const node_crypto_1 = require("node:crypto");
const sandbox_1 = require("@n8n/agents/sandbox");
const instance_ai_1 = require("@n8n/instance-ai");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const uuid_1 = require("uuid");
const constants_1 = require("../../../constants");
const ai_service_retry_1 = require("../../../utils/ai-service-retry");
const sandbox_provider_1 = require("../sandbox-provider");
const SANDBOX_NAME_MAX_LEN = 63;
const SANDBOX_LABEL_MAX_LEN = 63;
const NAME_PREFIX_SLUG_MAX_LEN = 24;
const DEFAULT_SANDBOX_TTL_MS = 15 * 60 * 1000;
function sandboxConfigFingerprint(config) {
    return (0, node_crypto_1.createHash)('sha256').update(JSON.stringify(config)).digest('hex');
}
function slugifySandboxName(value, maxLen) {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug.slice(0, maxLen).replace(/-+$/, '');
}
function slugifySandboxLabel(value, maxLen) {
    return value
        .replace(/[^A-Za-z0-9_.-]+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '')
        .slice(0, maxLen)
        .replace(/[-.]+$/, '');
}
function getThreadScopedSandboxName(threadId) {
    return `instance-ai-thread-${threadId}`;
}
function buildThreadScopedSandboxName(threadId, namePrefix) {
    const parts = [];
    if (namePrefix) {
        const prefixSlug = slugifySandboxName(namePrefix, NAME_PREFIX_SLUG_MAX_LEN);
        if (prefixSlug)
            parts.push(prefixSlug);
    }
    const threadSlug = slugifySandboxName(getThreadScopedSandboxName(threadId), SANDBOX_NAME_MAX_LEN);
    if (threadSlug)
        parts.push(threadSlug);
    const name = slugifySandboxName(parts.join('-'), SANDBOX_NAME_MAX_LEN);
    if (!name)
        throw new n8n_workflow_1.UnexpectedError('Failed to build thread-scoped sandbox name');
    return name;
}
function buildThreadScopedSandboxLabels(threadId, namePrefix) {
    const baseName = getThreadScopedSandboxName(threadId);
    const labels = {
        'n8n-builder': slugifySandboxLabel(baseName, SANDBOX_LABEL_MAX_LEN),
        thread_id: slugifySandboxLabel(threadId, SANDBOX_LABEL_MAX_LEN),
    };
    if (namePrefix)
        labels.name_prefix = slugifySandboxLabel(namePrefix, SANDBOX_LABEL_MAX_LEN);
    return labels;
}
const N8N_SANDBOX_THREAD_ID_NAMESPACE = '5e6c2f7a-93a1-4b0e-8f27-c1d6a3b9e514';
function buildThreadScopedSandboxUuid(threadId) {
    return (0, uuid_1.v5)(getThreadScopedSandboxName(threadId), N8N_SANDBOX_THREAD_ID_NAMESPACE);
}
function withThreadScopedSandboxIdentity(config, threadId) {
    if (!config.enabled)
        return config;
    if (config.provider === 'n8n-sandbox') {
        return { ...config, id: buildThreadScopedSandboxUuid(threadId) };
    }
    const name = buildThreadScopedSandboxName(threadId, config.namePrefix);
    return {
        ...config,
        id: name,
        name,
        labels: {
            ...buildThreadScopedSandboxLabels(threadId, config.namePrefix),
            ...config.labels,
        },
    };
}
class InstanceAiSandboxService {
    constructor(options) {
        this.options = options;
        this.sandboxes = new Map();
        this.sandboxCreations = new Map();
        this.cacheGeneration = 0;
    }
    get logger() {
        return this.options.logger;
    }
    get instanceAiConfig() {
        return this.options.config;
    }
    getSandboxConfigFromEnv() {
        const { sandboxEnabled, sandboxProvider, daytonaApiUrl, daytonaApiKey, n8nSandboxServiceUrl, n8nSandboxServiceApiKey, sandboxImage, sandboxSnapshot, sandboxTimeout, sandboxNamePrefix, sandboxEphemeral, sandboxAutoStopMinutes, sandboxAutoArchiveMinutes, sandboxAutoDeleteMinutes, daytonaTokenRefreshSkewMs, } = this.instanceAiConfig;
        const provider = (0, sandbox_provider_1.normalizeSandboxProvider)(sandboxProvider);
        if (!sandboxEnabled) {
            return {
                enabled: false,
                provider,
                timeout: sandboxTimeout,
            };
        }
        if (provider === 'daytona') {
            return {
                enabled: true,
                provider: 'daytona',
                daytonaApiUrl: daytonaApiUrl || undefined,
                daytonaApiKey: daytonaApiKey || undefined,
                image: sandboxImage || undefined,
                snapshot: sandboxSnapshot || undefined,
                n8nVersion: constants_1.N8N_VERSION || undefined,
                timeout: sandboxTimeout,
                namePrefix: sandboxNamePrefix || undefined,
                ephemeral: sandboxEphemeral,
                autoStopInterval: sandboxAutoStopMinutes,
                autoArchiveInterval: sandboxAutoArchiveMinutes,
                autoDeleteInterval: sandboxEphemeral ? undefined : sandboxAutoDeleteMinutes,
                refreshSkewMs: daytonaTokenRefreshSkewMs,
            };
        }
        return {
            enabled: true,
            provider: 'n8n-sandbox',
            serviceUrl: (0, sandbox_provider_1.requireN8nSandboxServiceUrl)(n8nSandboxServiceUrl),
            apiKey: n8nSandboxServiceApiKey || undefined,
            timeout: sandboxTimeout,
            ephemeral: sandboxEphemeral,
        };
    }
    async resolveSandboxConfig(user) {
        const base = this.getSandboxConfigFromEnv();
        if (!base.enabled)
            return base;
        if (base.provider === 'daytona') {
            if (this.options.aiService.isProxyEnabled()) {
                const client = await this.options.aiService.getClient();
                const proxyConfig = await (0, ai_service_retry_1.callAiServiceWithRetry)('Sandbox proxy config fetch', async () => await client.getSandboxProxyConfig(), this.logger, this.options.errorReporter);
                return {
                    ...base,
                    daytonaApiUrl: client.getSandboxProxyBaseUrl(),
                    image: proxyConfig.image,
                    logger: this.logger,
                    getAuthToken: async () => {
                        const token = await (0, ai_service_retry_1.callAiServiceWithRetry)('Sandbox proxy token mint', async () => await client.getInstanceAiApiProxyToken({ id: user.id }, { userMessageId: (0, nanoid_1.nanoid)() }), this.logger, this.options.errorReporter);
                        return token.accessToken;
                    },
                };
            }
            const daytona = await this.options.settingsService.resolveDaytonaConfig();
            const daytonaApiKey = daytona.apiKey ?? base.daytonaApiKey;
            if (!daytonaApiKey) {
                throw new n8n_workflow_1.OperationalError('The Daytona sandbox is enabled in direct mode but no API key is configured. Set the Daytona API key environment variable or connect the Daytona credential.');
            }
            return {
                ...base,
                daytonaApiUrl: daytona.apiUrl ?? base.daytonaApiUrl,
                daytonaApiKey,
            };
        }
        const sandbox = await this.options.settingsService.resolveN8nSandboxConfig();
        return {
            ...base,
            serviceUrl: sandbox.serviceUrl ?? base.serviceUrl,
            apiKey: sandbox.apiKey ?? base.apiKey,
        };
    }
    async getOrCreateWorkspaceEntry(threadId, user) {
        let outcome = 'acquired';
        return await (0, instance_ai_1.traceSandboxOperation)('acquire', {
            inputs: { threadId },
            processResult: (entry) => ({
                outputs: {
                    outcome: entry ? outcome : 'disabled',
                    sandboxId: entry?.sandbox.id,
                    provider: entry?.sandbox.provider,
                },
            }),
        }, async () => {
            const cacheGeneration = this.cacheGeneration;
            const cacheState = await (0, instance_ai_1.traceSandboxOperation)('resolve-config', { inputs: { threadId } }, async () => await this.resolveSandboxCacheState(user));
            if (cacheGeneration !== this.cacheGeneration) {
                return await this.getOrCreateWorkspaceEntry(threadId, user);
            }
            const existing = this.sandboxes.get(threadId);
            if (existing) {
                if (existing.configFingerprint !== cacheState.fingerprint ||
                    (this.isSandboxEntryExpired(existing) && !this.isSandboxInUse(threadId))) {
                    this.evictSandboxEntry(threadId, existing, existing.configFingerprint !== cacheState.fingerprint ? 'config_changed' : 'idle');
                }
                else {
                    this.touchSandboxEntry(threadId, existing);
                    outcome = 'cached';
                    return existing;
                }
            }
            const pending = this.sandboxCreations.get(threadId);
            if (pending?.fingerprint === cacheState.fingerprint) {
                outcome = 'shared_acquisition';
                return await pending.promise;
            }
            const creation = this.createWorkspaceEntry(threadId, user, cacheState);
            const pendingCreation = { fingerprint: cacheState.fingerprint, promise: creation };
            this.sandboxCreations.set(threadId, pendingCreation);
            try {
                const entry = await creation;
                if (entry &&
                    cacheGeneration === this.cacheGeneration &&
                    this.sandboxCreations.get(threadId) === pendingCreation) {
                    this.sandboxes.set(threadId, entry);
                    this.scheduleSandboxExpiry(threadId, entry);
                }
                return entry;
            }
            finally {
                if (this.sandboxCreations.get(threadId) === pendingCreation) {
                    this.sandboxCreations.delete(threadId);
                }
            }
        });
    }
    async getOrCreateWorkspace(threadId, user, context) {
        const entry = await this.getOrCreateWorkspaceEntry(threadId, user);
        if (entry)
            await this.ensureWorkspaceSetup(entry, context);
        return entry;
    }
    async ensureWorkspaceSetup(entry, context) {
        if (entry.setupComplete) {
            if (entry.sandbox.provider !== 'n8n-sandbox' ||
                (await (0, instance_ai_1.isSandboxWorkspaceInitialized)(entry.workspace))) {
                return;
            }
            entry.setupComplete = false;
            entry.verifiedBundles.clear();
        }
        entry.setupPromise ??= (0, instance_ai_1.setupSandboxWorkspace)(entry.workspace, context, {
            verifiedBundles: entry.verifiedBundles,
        })
            .then(() => {
            entry.setupComplete = true;
        })
            .finally(() => {
            entry.setupPromise = undefined;
        });
        await entry.setupPromise;
    }
    async createWorkspaceEntry(threadId, user, cacheState) {
        const config = withThreadScopedSandboxIdentity(cacheState.config ?? (await this.resolveSandboxConfig(user)), threadId);
        if (!config.enabled)
            return undefined;
        const sandbox = await (0, instance_ai_1.createSandbox)(config, {
            logger: this.logger,
            errorReporter: this.options.errorReporter,
            useSnapshotFallback: true,
        });
        const workspace = (0, instance_ai_1.createWorkspace)(sandbox);
        if (!sandbox || !workspace)
            return undefined;
        try {
            await (0, instance_ai_1.traceSandboxOperation)('start', { inputs: { threadId, sandboxId: sandbox.id, provider: sandbox.provider } }, async () => await workspace.init());
        }
        catch (error) {
            try {
                await (0, instance_ai_1.traceSandboxOperation)('cleanup-failed-start', { inputs: { threadId, sandboxId: sandbox.id } }, async () => await workspace.destroy());
            }
            catch {
            }
            if (error instanceof sandbox_1.SandboxAcquisitionError &&
                error.constructor === sandbox_1.SandboxAcquisitionError) {
                throw new n8n_workflow_1.OperationalError(error.message, { cause: error });
            }
            throw error;
        }
        const entry = {
            userId: user.id,
            sandbox,
            workspace,
            configFingerprint: cacheState.fingerprint,
            verifiedBundles: new Map(),
            setupComplete: false,
            setupPromise: undefined,
            expiresAt: this.nextSandboxExpiry(),
        };
        return entry;
    }
    async resolveSandboxCacheState(user) {
        if (this.options.aiService.isProxyEnabled()) {
            return {
                fingerprint: sandboxConfigFingerprint({
                    mode: 'proxy',
                    config: this.getSandboxConfigFromEnv(),
                }),
            };
        }
        const config = await this.resolveSandboxConfig(user);
        return { config, fingerprint: sandboxConfigFingerprint(config) };
    }
    invalidateCachedWorkspaces() {
        this.cacheGeneration++;
        this.sandboxCreations.clear();
        for (const [threadId, entry] of this.sandboxes) {
            this.evictSandboxEntry(threadId, entry);
        }
    }
    evictSandboxEntry(threadId, entry, reason = 'settings_changed', detached = false) {
        if (this.sandboxes.get(threadId) !== entry)
            return;
        this.sandboxes.delete(threadId);
        if (entry.cleanupTimer) {
            clearTimeout(entry.cleanupTimer);
            entry.cleanupTimer = undefined;
        }
        void (0, instance_ai_1.withSandboxLifecycleTrace)(threadId, 'evict-cache', {
            reason,
            sandboxId: entry.sandbox.id,
            provider: entry.sandbox.provider,
            occurredAt: new Date().toISOString(),
            remoteDestroyed: false,
        }, async () => { }, { resolveConfig: this.lifecycleTraceConfig(threadId, entry.userId), detached }).catch(() => {
        });
    }
    async destroySandbox(threadId, reason = 'thread_cleanup', userId) {
        const entry = this.sandboxes.get(threadId);
        if (!entry?.sandbox) {
            await this.destroyUncachedSandbox(threadId, reason, userId);
            return;
        }
        this.evictSandboxEntry(threadId, entry, reason);
        try {
            await (0, instance_ai_1.withSandboxLifecycleTrace)(threadId, 'destroy', { reason, sandboxId: entry.sandbox.id, provider: entry.sandbox.provider }, async () => await entry.workspace.destroy(), { resolveConfig: this.lifecycleTraceConfig(threadId, entry.userId) });
        }
        catch (error) {
            this.logger.warn('Failed to destroy sandbox', {
                threadId,
                reason,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async destroyUncachedSandbox(threadId, reason, userId) {
        try {
            if (!this.instanceAiConfig.sandboxEnabled ||
                (0, sandbox_provider_1.normalizeSandboxProvider)(this.instanceAiConfig.sandboxProvider) !== 'n8n-sandbox')
                return;
            await (0, instance_ai_1.withSandboxLifecycleTrace)(threadId, 'destroy', { reason, cached: false }, async () => {
                const base = this.getSandboxConfigFromEnv();
                if (!base.enabled || base.provider !== 'n8n-sandbox')
                    return;
                const settings = await this.options.settingsService.resolveN8nSandboxConfig();
                const config = withThreadScopedSandboxIdentity({
                    ...base,
                    serviceUrl: settings.serviceUrl ?? base.serviceUrl,
                    apiKey: settings.apiKey ?? base.apiKey,
                }, threadId);
                const sandbox = await (0, instance_ai_1.createSandbox)(config, {
                    logger: this.logger,
                    errorReporter: this.options.errorReporter,
                });
                await (0, instance_ai_1.traceSandboxOperation)('destroy-remote', {
                    inputs: { sandboxId: sandbox?.id, provider: base.provider },
                }, async () => await sandbox?.destroy?.());
            }, { resolveConfig: this.lifecycleTraceConfig(threadId, userId) });
        }
        catch (error) {
            this.logger.warn('Failed to destroy sandbox', {
                threadId,
                reason,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    lifecycleTraceConfig(threadId, userId) {
        const resolve = this.options.resolveTracingConfig;
        return resolve ? async () => await resolve(threadId, userId) : undefined;
    }
    get sandboxTtlMs() {
        return this.instanceAiConfig?.builderSandboxTtlMs ?? DEFAULT_SANDBOX_TTL_MS;
    }
    nextSandboxExpiry() {
        return Date.now() + this.sandboxTtlMs;
    }
    isSandboxEntryExpired(entry) {
        return this.sandboxTtlMs > 0 && entry.expiresAt <= Date.now();
    }
    touchSandboxEntry(threadId, entry) {
        if (this.sandboxTtlMs <= 0)
            return;
        entry.expiresAt = this.nextSandboxExpiry();
        this.scheduleSandboxExpiry(threadId, entry);
    }
    isSandboxInUse(threadId) {
        return Boolean(this.options.runState.getActiveRunId(threadId) ||
            this.options.runState.hasSuspendedRun(threadId) ||
            this.options.backgroundTasks.getRunningTasks(threadId).length > 0);
    }
    scheduleSandboxExpiry(threadId, entry) {
        if (this.sandboxTtlMs <= 0)
            return;
        if (entry.cleanupTimer)
            clearTimeout(entry.cleanupTimer);
        const delay = Math.max(0, entry.expiresAt - Date.now());
        entry.cleanupTimer = setTimeout(() => {
            const current = this.sandboxes.get(threadId);
            if (current !== entry)
                return;
            if (this.isSandboxInUse(threadId)) {
                this.touchSandboxEntry(threadId, entry);
                return;
            }
            this.evictSandboxEntry(threadId, entry, 'idle', true);
        }, delay);
        entry.cleanupTimer.unref();
    }
    stopSandboxExpiryTimers() {
        for (const entry of this.sandboxes.values()) {
            if (!entry.cleanupTimer)
                continue;
            clearTimeout(entry.cleanupTimer);
            entry.cleanupTimer = undefined;
        }
    }
}
exports.InstanceAiSandboxService = InstanceAiSandboxService;
//# sourceMappingURL=instance-ai-sandbox.service.js.map