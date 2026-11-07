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
exports.AgentChannelReconciler = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const scrub_secrets_1 = require("@n8n/utils/scrub-secrets");
const n8n_core_1 = require("n8n-core");
const agent_channel_1 = require("../utils/agent-channel");
const agent_channel_status_reporter_1 = require("./agent-channel-status-reporter");
const agent_chat_integration_1 = require("./agent-chat-integration");
const chat_integration_service_1 = require("./chat-integration.service");
const agent_channel_status_repository_1 = require("../repositories/agent-channel-status.repository");
const agent_repository_1 = require("../repositories/agent.repository");
const SHUTDOWN_SETTLE_MS = 5 * constants_1.Time.seconds.toMilliseconds;
let AgentChannelReconciler = class AgentChannelReconciler {
    constructor(logger, agentsConfig, agentRepository, channelStatusRepository, statusReporter, chatIntegrationService, integrationRegistry, instanceSettings, errorReporter) {
        this.logger = logger;
        this.agentsConfig = agentsConfig;
        this.agentRepository = agentRepository;
        this.channelStatusRepository = channelStatusRepository;
        this.statusReporter = statusReporter;
        this.chatIntegrationService = chatIntegrationService;
        this.integrationRegistry = integrationRegistry;
        this.instanceSettings = instanceSettings;
        this.errorReporter = errorReporter;
        this.isInitialized = false;
        this.isShuttingDown = false;
    }
    init() {
        const intervalSeconds = this.agentsConfig.channelReconcileIntervalSeconds;
        if (intervalSeconds <= 0) {
            this.logger.info('[AgentChannelReconciler] Periodic channel reconciliation is disabled — channels still start on boot and on leader takeover, and one that fails to start is retried on either, but nothing will retry it in between except republishing the agent');
        }
        else {
            this.reconcileInterval = setInterval(async () => await this.reconcile('interval'), intervalSeconds * constants_1.Time.seconds.toMilliseconds);
            this.reconcileInterval.unref();
            this.logger.debug(`[AgentChannelReconciler] Reconciling channels every ${intervalSeconds}s`);
        }
        this.isInitialized = true;
        void this.reconcile('startup');
    }
    async shutdown() {
        this.isShuttingDown = true;
        clearInterval(this.reconcileInterval);
        this.reconcileInterval = undefined;
        await this.settleInFlight();
        await this.statusReporter.withdrawAll();
    }
    async settleInFlight() {
        const pass = this.inFlight;
        if (!pass)
            return;
        let timer;
        const bound = new Promise((resolve) => {
            timer = setTimeout(resolve, SHUTDOWN_SETTLE_MS);
            timer.unref();
        });
        try {
            await Promise.race([pass.catch(() => { }), bound]);
        }
        finally {
            clearTimeout(timer);
        }
    }
    async reconcileOnLeaderTakeover() {
        if (!this.isInitialized)
            return;
        await this.reconcile('leader-takeover');
    }
    async reconcile(reason) {
        if (this.isShuttingDown)
            return;
        if (this.inFlight && reason === 'interval')
            return await this.inFlight.catch(() => { });
        const pass = (this.inFlight ?? Promise.resolve())
            .catch(() => { })
            .then(async () => {
            if (this.isShuttingDown)
                return;
            await this.runPass(reason);
        });
        this.inFlight = pass;
        try {
            await pass;
        }
        finally {
            if (this.inFlight === pass)
                this.inFlight = undefined;
        }
    }
    async runPass(reason) {
        try {
            const agents = await this.agentRepository.findPublished();
            const ownStatuses = await this.channelStatusRepository.findOwnAll();
            const wantedHere = this.collectWantedChannels(agents);
            await this.settleWanted(wantedHere, ownStatuses, reason);
            await this.releaseGhosts(wantedHere);
            await this.forgetOwnOrphans(wantedHere, ownStatuses);
            await this.sweepExpired();
        }
        catch (error) {
            this.errorReporter.error(error, { shouldBeLogged: true });
        }
    }
    runsHere(integration) {
        const definition = this.integrationRegistry.get(integration.type);
        return !definition?.requiresLeader() || this.instanceSettings.isLeader;
    }
    async settleWanted(wantedHere, ownStatuses, reason) {
        const ownByChannel = new Map(ownStatuses.map((status) => [(0, agent_channel_1.agentChannelKey)(status), status]));
        const now = new Date();
        for (const [key, { agent, integration }] of wantedHere) {
            if (this.isShuttingDown)
                return;
            await this.settleChannel(agent, integration, ownByChannel.get(key), reason, now);
        }
    }
    async affirmRunning(ref, own) {
        if (own?.status === 'connected') {
            await this.statusReporter.refreshLease(ref);
            return;
        }
        await this.statusReporter.recordConnected(ref);
    }
    async releaseGhosts(wantedHere) {
        for (const ref of this.chatIntegrationService.listLiveChannels()) {
            if (this.isShuttingDown)
                return;
            if (wantedHere.has((0, agent_channel_1.agentChannelKey)(ref)))
                continue;
            try {
                await this.chatIntegrationService.releaseChannelLocally(ref.agentId, {
                    type: ref.integrationType,
                    credentialId: ref.credentialId,
                });
                this.logger.info('[AgentChannelReconciler] Released channel', {
                    agentId: ref.agentId,
                    type: ref.integrationType,
                });
            }
            catch (error) {
                this.logger.warn('[AgentChannelReconciler] Could not release channel', {
                    agentId: ref.agentId,
                    type: ref.integrationType,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    async forgetOwnOrphans(wantedHere, ownStatuses) {
        for (const status of ownStatuses) {
            if (this.isShuttingDown)
                return;
            if (wantedHere.has((0, agent_channel_1.agentChannelKey)(status)))
                continue;
            await this.statusReporter.withdraw({
                agentId: status.agentId,
                integrationType: status.integrationType,
                credentialId: status.credentialId,
            });
        }
    }
    async sweepExpired() {
        if (!this.instanceSettings.isLeader)
            return;
        try {
            const deleted = await this.channelStatusRepository.deleteExpired(new Date());
            if (deleted > 0) {
                this.logger.debug(`[AgentChannelReconciler] Cleared ${deleted} channel status rows left by instances that are gone`);
            }
        }
        catch (error) {
            this.logger.warn('[AgentChannelReconciler] Could not sweep expired channel statuses', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    collectWantedChannels(agents) {
        const wanted = new Map();
        for (const agent of agents) {
            const integrations = (agent.integrations ?? []).filter((integration) => (0, api_types_1.isCredentialAgentIntegration)(integration) &&
                !(0, api_types_1.isDraftIntegration)(integration) &&
                this.runsHere(integration));
            for (const integration of integrations) {
                wanted.set((0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agent.id, integration)), { agent, integration });
            }
        }
        return wanted;
    }
    async settleChannel(agent, integration, own, reason, now) {
        const ref = (0, agent_channel_1.agentChannelRef)(agent.id, integration);
        if (!this.runsHere(integration)) {
            await this.statusReporter.withdraw(ref);
            return;
        }
        if (this.chatIntegrationService.hasLiveChannel(ref)) {
            await this.affirmRunning(ref, own);
            return;
        }
        if (reason === 'interval' && !this.statusReporter.isRetryReady(own, now)) {
            await this.statusReporter.refreshLease(ref);
            return;
        }
        await this.startWantedChannel(agent, integration, own, reason);
    }
    async startWantedChannel(agent, integration, own, reason) {
        try {
            await this.chatIntegrationService.startChannel(agent, integration);
            this.logger.info('[AgentChannelReconciler] Started channel', {
                agentId: agent.id,
                type: integration.type,
                reason,
            });
        }
        catch (error) {
            this.logger.warn('[AgentChannelReconciler] Could not start channel', {
                agentId: agent.id,
                type: integration.type,
                attempts: (own?.attempts ?? 0) + 1,
                error: (0, scrub_secrets_1.scrubSecretsInText)(error instanceof Error ? error.message : String(error)),
            });
        }
    }
};
exports.AgentChannelReconciler = AgentChannelReconciler;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentChannelReconciler.prototype, "shutdown", null);
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentChannelReconciler.prototype, "reconcileOnLeaderTakeover", null);
exports.AgentChannelReconciler = AgentChannelReconciler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.AgentsConfig, agent_repository_1.AgentRepository, agent_channel_status_repository_1.AgentChannelStatusRepository, agent_channel_status_reporter_1.AgentChannelStatusReporter, chat_integration_service_1.ChatIntegrationService, agent_chat_integration_1.ChatIntegrationRegistry, n8n_core_1.InstanceSettings, n8n_core_1.ErrorReporter])
], AgentChannelReconciler);
//# sourceMappingURL=agent-channel-reconciler.service.js.map