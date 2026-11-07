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
exports.AgentRuntimeCacheService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../credentials/credentials.service");
const ttl_map_1 = require("../../utils/ttl-map");
const agent_sandbox_principal_1 = require("./agent-sandbox-principal");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
const agent_change_publisher_service_1 = require("./agent-change-publisher.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_telemetry_1 = require("./agent-telemetry");
const agent_runtime_reconstruction_service_1 = require("./agent-runtime-reconstruction.service");
const agent_repository_1 = require("./repositories/agent.repository");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const agent_credential_provider_1 = require("./utils/agent-credential-provider");
const agent_published_snapshot_1 = require("./utils/agent-published-snapshot");
const TOOL_ACCESS_RECHECK_INTERVAL_MS = constants_1.Time.minutes.toMilliseconds;
let AgentRuntimeCacheService = class AgentRuntimeCacheService {
    constructor(logger, agentRepository, changePublisher, agentRuntimeReconstructionService, credentialsService, agentSandboxRuntimeService, agentSkillRefs) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.changePublisher = changePublisher;
        this.agentRuntimeReconstructionService = agentRuntimeReconstructionService;
        this.credentialsService = credentialsService;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
        this.agentSkillRefs = agentSkillRefs;
        this.runtimes = new ttl_map_1.TtlMap(30 * constants_1.Time.minutes.toMilliseconds, undefined, (runtime) => this.closeAgentResources(runtime.agent, runtime.agentId));
        this.runtimeInitializations = new Map();
        this.toolAccessRechecks = new WeakMap();
        this.activeRuntimeLeases = new WeakMap();
        this.runtimesPendingClose = new WeakMap();
    }
    computeRuntimeCacheKey(params) {
        const sandboxEnabled = this.agentSandboxRuntimeService.isEnabled();
        const parts = [params.agentId, params.usePublishedVersion ? 'published' : 'draft'];
        if (params.previewChat)
            parts.push('preview');
        if (params.integrationType)
            parts.push(params.integrationType);
        if (params.allowBackgroundTasks === false)
            parts.push('no-background-tasks');
        if (params.attributionUserId)
            parts.push(`attribution:${params.attributionUserId}`);
        if (sandboxEnabled && params.sandboxPrincipalHash) {
            parts.push(`sandbox:${params.sandboxPrincipalHash}`);
        }
        else if (!params.usePublishedVersion && params.user) {
            parts.push(`user:${(0, agent_sandbox_principal_1.hashAgentSandboxPrincipal)({ type: 'n8n-user', userId: params.user.id })}`);
        }
        return parts.join(':');
    }
    isRuntimeCacheKeyForAgent(key, agentId) {
        return key === agentId || key.startsWith(`${agentId}:`);
    }
    clearRuntimes(agentId, options = {}) {
        for (const key of this.runtimes.keys()) {
            if (!this.isRuntimeCacheKeyForAgent(key, agentId))
                continue;
            const entry = this.runtimes.get(key);
            this.runtimes.delete(key);
            if (entry)
                this.closeAgentResources(entry.agent, agentId);
        }
        for (const key of this.runtimeInitializations.keys()) {
            if (this.isRuntimeCacheKeyForAgent(key, agentId)) {
                this.runtimeInitializations.delete(key);
            }
        }
        if (options.skipBroadcast)
            return;
        void this.changePublisher.publish({ command: 'agent-config-changed', payload: { agentId } });
    }
    handleAgentConfigChanged(payload) {
        this.clearRuntimes(payload.agentId, { skipBroadcast: true });
    }
    closeAgentResources(agent, agentId) {
        if (this.activeRuntimeLeases.has(agent)) {
            this.runtimesPendingClose.set(agent, agentId);
            return;
        }
        agent.close().catch((error) => {
            this.logger.warn('[AgentRuntimeCacheService] Failed to close agent resources on eviction', {
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }
    acquireRuntimeLease(runtime) {
        const { agent } = runtime;
        this.activeRuntimeLeases.set(agent, (this.activeRuntimeLeases.get(agent) ?? 0) + 1);
        return runtime;
    }
    releaseRuntimeLease(agent) {
        const activeLeases = this.activeRuntimeLeases.get(agent);
        if (activeLeases === undefined)
            return;
        if (activeLeases > 1) {
            this.activeRuntimeLeases.set(agent, activeLeases - 1);
            return;
        }
        this.activeRuntimeLeases.delete(agent);
        const agentId = this.runtimesPendingClose.get(agent);
        if (agentId !== undefined) {
            this.runtimesPendingClose.delete(agent);
            this.closeAgentResources(agent, agentId);
        }
    }
    async getRuntime(params) {
        if (this.agentSandboxRuntimeService.isEnabled() && !params.sandboxPrincipalHash) {
            throw new n8n_workflow_1.UserError('Agent workspace scope is missing and the runtime cannot be reconstructed');
        }
        const cacheKey = this.computeRuntimeCacheKey(params);
        const cached = this.runtimes.get(cacheKey);
        if (cached) {
            const runtime = await this.acquireCachedRuntime(cacheKey, cached, params);
            if (runtime)
                return runtime;
        }
        const initialization = this.runtimeInitializations.get(cacheKey);
        if (initialization)
            return this.acquireRuntimeLease(await initialization.promise);
        return this.acquireRuntimeLease(await this.initializeRuntime(cacheKey, params).promise);
    }
    async toolAccessStillCurrent(runtime, params) {
        const { userToolAccessSnapshot } = runtime;
        const { user } = params;
        if (!userToolAccessSnapshot || !user)
            return true;
        if (Date.now() - runtime.toolAccessCheckedAt < TOOL_ACCESS_RECHECK_INTERVAL_MS)
            return true;
        const inFlight = this.toolAccessRechecks.get(runtime);
        if (inFlight)
            return await inFlight;
        const recheck = (async () => {
            try {
                const stillGranted = await this.agentRuntimeReconstructionService.userStillHasToolAccess(userToolAccessSnapshot, params.projectId, user);
                if (stillGranted)
                    runtime.toolAccessCheckedAt = Date.now();
                return stillGranted;
            }
            catch (error) {
                runtime.toolAccessCheckedAt = Date.now();
                this.logger.warn('[AgentRuntimeCacheService] Failed to re-check tool access', {
                    agentId: runtime.agentId,
                    error: error instanceof Error ? error.message : String(error),
                });
                return true;
            }
        })();
        this.toolAccessRechecks.set(runtime, recheck);
        try {
            return await recheck;
        }
        finally {
            if (this.toolAccessRechecks.get(runtime) === recheck) {
                this.toolAccessRechecks.delete(runtime);
            }
        }
    }
    async reconstructRuntime(params) {
        const { agentId, projectId, integrationType, usePublishedVersion, user, sandboxPrincipalHash, allowBackgroundTasks, previewChat, attributionUserId, } = params;
        const agentEntity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, `Agent ${agentId} not found`);
        const runSource = await (0, agent_published_snapshot_1.resolveAgentRunSource)(agentEntity, usePublishedVersion === true, this.agentSkillRefs, {});
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user, agentId);
        const reconstruction = this.agentRuntimeReconstructionService.reconstructFromAgentEntity(runSource, credentialProvider, usePublishedVersion ? 'production' : 'test', integrationType, user, undefined, usePublishedVersion ? 'integrated' : 'manual', sandboxPrincipalHash, { previewChat, allowBackgroundTasks, attributionUserId });
        const { agent: agentInstance, toolRegistry, mcpServerAttributions, userToolAccessSnapshot, budget, } = await reconstruction;
        return {
            agent: agentInstance,
            agentId,
            toolRegistry,
            mcpServerAttributions,
            ...(budget !== undefined ? { budget } : {}),
            projectId,
            telemetryConfiguration: (0, agent_telemetry_1.buildAgentConfigurationTelemetry)(runSource),
            ...(userToolAccessSnapshot !== undefined ? { userToolAccessSnapshot } : {}),
            toolAccessCheckedAt: Date.now(),
        };
    }
    async acquireCachedRuntime(cacheKey, cached, params) {
        const accessStillCurrent = await this.toolAccessStillCurrent(cached, params);
        const current = this.runtimes.get(cacheKey);
        if (current !== cached) {
            if (current)
                return this.acquireRuntimeLease(current);
            return undefined;
        }
        if (accessStillCurrent) {
            this.runtimes.touch(cacheKey);
            return this.acquireRuntimeLease(cached);
        }
        this.runtimes.delete(cacheKey);
        this.closeAgentResources(cached.agent, params.agentId);
        return undefined;
    }
    initializeRuntime(cacheKey, params) {
        const token = Symbol(cacheKey);
        const runtimeInitialization = {
            token,
            promise: (async () => {
                const runtime = await this.reconstructRuntime(params);
                if (this.runtimeInitializations.get(cacheKey)?.token !== token) {
                    this.closeAgentResources(runtime.agent, params.agentId);
                    throw new Error(`Agent ${params.agentId} runtime initialization was invalidated`);
                }
                this.runtimes.set(cacheKey, runtime);
                const cachedRuntime = this.runtimes.get(cacheKey);
                if (!cachedRuntime)
                    throw new Error(`Agent ${params.agentId} failed to reconstruct`);
                return cachedRuntime;
            })(),
        };
        runtimeInitialization.promise = runtimeInitialization.promise.finally(() => {
            if (this.runtimeInitializations.get(cacheKey)?.token === token) {
                this.runtimeInitializations.delete(cacheKey);
            }
        });
        this.runtimeInitializations.set(cacheKey, runtimeInitialization);
        return runtimeInitialization;
    }
};
exports.AgentRuntimeCacheService = AgentRuntimeCacheService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('agent-config-changed', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentRuntimeCacheService.prototype, "handleAgentConfigChanged", null);
exports.AgentRuntimeCacheService = AgentRuntimeCacheService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_change_publisher_service_1.AgentChangePublisher, agent_runtime_reconstruction_service_1.AgentRuntimeReconstructionService, credentials_service_1.CredentialsService, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentRuntimeCacheService);
//# sourceMappingURL=agent-runtime-cache.service.js.map