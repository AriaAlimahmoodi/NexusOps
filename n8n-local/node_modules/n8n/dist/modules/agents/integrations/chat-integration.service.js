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
exports.ChatIntegrationService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_2 = require("../../../constants");
const credentials_service_1 = require("../../../credentials/credentials.service");
const backend_services_1 = require("@n8n/backend-services");
const agent_chat_bridge_1 = require("./agent-chat-bridge");
const agent_chat_integration_1 = require("./agent-chat-integration");
const agent_chat_subscription_state_service_1 = require("./agent-chat-subscription-state.service");
const component_mapper_1 = require("./component-mapper");
const esm_loader_1 = require("./esm-loader");
const integration_tools_1 = require("./integration-tools");
const leader_channel_relay_service_1 = require("./leader-channel-relay.service");
const channel_integration_recorder_1 = require("./recording/channel-integration-recorder");
const recording_adapter_1 = require("./recording/recording-adapter");
const agent_entity_1 = require("../entities/agent.entity");
const agent_change_publisher_service_1 = require("../agent-change-publisher.service");
const agent_channel_1 = require("../utils/agent-channel");
const agent_repository_1 = require("../repositories/agent.repository");
const agent_channel_status_reporter_1 = require("./agent-channel-status-reporter");
const SHUTDOWN_DRAIN_MS = 5 * constants_1.Time.seconds.toMilliseconds;
async function getAgentExecutionOrchestratorService() {
    const { AgentExecutionOrchestratorService } = await import('../agent-execution-orchestrator.service.js');
    return di_1.Container.get(AgentExecutionOrchestratorService);
}
function streamingOptionsFor(type) {
    if (type !== 'teams')
        return {};
    return { fallbackStreamingPlaceholderText: '…', streamingUpdateIntervalMs: 750 };
}
let ChatIntegrationService = class ChatIntegrationService {
    constructor(logger, agentRepository, credentialsService, urlService, integrationRegistry, instanceSettings, changePublisher, globalConfig, chatSubscriptionStateService, statusReporter, leaderChannelRelay) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.credentialsService = credentialsService;
        this.urlService = urlService;
        this.integrationRegistry = integrationRegistry;
        this.instanceSettings = instanceSettings;
        this.changePublisher = changePublisher;
        this.globalConfig = globalConfig;
        this.chatSubscriptionStateService = chatSubscriptionStateService;
        this.statusReporter = statusReporter;
        this.leaderChannelRelay = leaderChannelRelay;
        this.connections = new Map();
        this.outboundConnections = new Map();
        this.outboundConnectionInitializations = new Map();
        this.leaderOperations = new Map();
        this.shuttingDown = false;
    }
    async broadcastIntegrationChange(agentId, integration, action) {
        if (!(0, api_types_1.isCredentialAgentIntegration)(integration))
            return;
        await this.changePublisher.publish({
            command: 'agent-chat-integration-changed',
            payload: { agentId, integration, action },
        });
    }
    integrationFromConnectionKey(key) {
        const type = key.split(':')[1];
        return type ? this.integrationRegistry.get(type) : undefined;
    }
    async assertStartupPreconditions(agentId, integration, projectId) {
        if (!(0, api_types_1.isCredentialAgentIntegration)(integration))
            return;
        const implementation = this.integrationRegistry.require(integration.type);
        await implementation.assertStartupPreconditions?.({
            agentId,
            projectId,
            credentialId: integration.credentialId,
        });
    }
    async validateBeforeConnect(agentId, integration, projectId) {
        if (!(0, api_types_1.isCredentialAgentIntegration)(integration))
            return;
        const implementation = this.integrationRegistry.require(integration.type);
        implementation.validateConfig?.(integration);
        if (!implementation.onBeforeConnect)
            return;
        const credential = await this.decryptCredentialForProject(integration.credentialId, projectId);
        await implementation.onBeforeConnect({
            agentId,
            projectId,
            integration,
            credentialId: integration.credentialId,
            credential,
            ingressEnabled: true,
            webhookUrlFor: (platform) => this.buildWebhookUrl(agentId, projectId, platform),
        });
    }
    async connect(agentId, integration, projectId, options = {}) {
        if (!(0, api_types_1.isCredentialAgentIntegration)(integration))
            return;
        const ingress = options.ingressEnabled ?? true;
        if (!this.shouldRouteToLeader(integration.type, ingress)) {
            return await this.connectLocal(agentId, integration, projectId, options);
        }
        await this.disconnectLocal(agentId, integration, { skipExternalHooks: true });
        try {
            await this.leaderChannelRelay.request({ agentId, integration, action: 'connect' });
        }
        catch (error) {
            void this.leaderChannelRelay
                .requestWithoutAck({ agentId, integration, action: 'disconnect' })
                .catch((releaseError) => {
                this.logger.warn(`[ChatIntegrationService] Could not release the leader's runtime after a failed connect for ${integration.type} on agent ${agentId}: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`);
            });
            throw error;
        }
    }
    async connectLocal(agentId, integration, projectId, options = {}) {
        if (this.shuttingDown) {
            throw new n8n_workflow_1.OperationalError('This instance is shutting down and cannot start a channel', {
                extra: { agentId, integrationType: integration.type },
            });
        }
        const ingressEnabled = options.ingressEnabled ?? true;
        if (!ingressEnabled) {
            await this.establishConnection(agentId, integration, projectId, options);
            return;
        }
        const ref = (0, agent_channel_1.agentChannelRef)(agentId, integration);
        try {
            await this.establishConnection(agentId, integration, projectId, options);
        }
        catch (error) {
            await this.statusReporter.recordFailure(ref, error);
            throw error;
        }
        await this.statusReporter.recordConnected(ref);
    }
    async establishConnection(agentId, integration, projectId, options = {}) {
        const key = (0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agentId, integration));
        const ingressEnabled = options.ingressEnabled ?? true;
        if (ingressEnabled) {
            await this.disconnectOutboundOne(key);
            if (this.connections.has(key)) {
                await this.disconnectOne(key);
            }
        }
        const integrationImpl = this.integrationRegistry.require(integration.type);
        const ctx = await this.createConnectionContext(agentId, projectId, integration, ingressEnabled);
        if (ingressEnabled && integrationImpl.onBeforeConnect && !options.skipExternalHooks) {
            await integrationImpl.onBeforeConnect(ctx);
        }
        const { chat, bridge } = await this.initializeConnection(ctx, integrationImpl, options, key);
        const targetConnections = ingressEnabled ? this.connections : this.outboundConnections;
        targetConnections.set(key, {
            chat,
            bridge,
            context: ctx,
            ref: (0, agent_channel_1.agentChannelRef)(agentId, integration),
        });
        await this.runConnectedHook(integrationImpl, ctx, key);
        this.logger.info(`[ChatIntegrationService] ${ingressEnabled ? 'Connected' : 'Outbound connected'}: ${key}`);
    }
    async disconnect(agentId, integration, options = {}) {
        if (!integration) {
            const keysToRemove = new Set([
                ...this.connections.keys(),
                ...this.outboundConnections.keys(),
                ...this.outboundConnectionInitializations.keys(),
            ].filter((key) => key.startsWith(`${agentId}:`)));
            for (const k of keysToRemove) {
                await this.disconnectOne(k, options);
                await this.disconnectOutboundOne(k);
            }
            return;
        }
        if (integration.credentialId !== '' && this.shouldRouteToLeader(integration.type, true)) {
            await this.disconnectLocal(agentId, integration, { skipExternalHooks: true });
            await this.leaderChannelRelay.request({ agentId, integration, action: 'disconnect' });
            return;
        }
        await this.disconnectLocal(agentId, integration, options);
    }
    async releaseChannelLocally(agentId, integration) {
        await this.disconnectLocal(agentId, integration, { skipExternalHooks: true });
    }
    async disconnectChannel(agentId, integration, options = {}) {
        if (!(0, api_types_1.isCredentialAgentIntegration)(integration))
            return;
        const { deleteSubscriptions = true } = options;
        try {
            await this.disconnect(agentId, integration);
        }
        catch (error) {
            this.logger.warn(`[ChatIntegrationService] Disconnect failed for ${integration.type} on agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
        }
        await this.broadcastIntegrationChange(agentId, integration, 'disconnect');
        if (!deleteSubscriptions)
            return;
        try {
            await this.chatSubscriptionStateService.deleteSubscriptionsForIntegration(agentId, integration);
        }
        catch (error) {
            this.logger.warn(`[ChatIntegrationService] Subscription cleanup failed for ${integration.type} on agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async disconnectAll() {
        this.shuttingDown = true;
        await this.settleLeaderOperations(SHUTDOWN_DRAIN_MS);
        for (const key of this.localRuntimeKeys()) {
            await this.disconnectOne(key, { skipExternalHooks: true });
            await this.disconnectOutboundOne(key);
        }
    }
    localRuntimeKeys() {
        return new Set([
            ...this.connections.keys(),
            ...this.outboundConnections.keys(),
            ...this.outboundConnectionInitializations.keys(),
        ]);
    }
    async disconnectLeaderOnlyIntegrations() {
        await this.settleLeaderOperations();
        for (const key of [...this.connections.keys()]) {
            const integration = this.integrationFromConnectionKey(key);
            if (integration?.requiresLeader()) {
                await this.disconnectOne(key, { skipExternalHooks: true });
            }
        }
    }
    async syncToConfig(agent, previous, next) {
        const previousExternal = previous.filter(api_types_1.isCredentialAgentIntegration);
        const nextExternal = next.filter(api_types_1.isCredentialAgentIntegration);
        const previousKeys = new Set(previousExternal.map(integration_tools_1.buildIntegrationConnectionId));
        const nextKeys = new Set(nextExternal.map(integration_tools_1.buildIntegrationConnectionId));
        for (const integration of previousExternal) {
            if (!nextKeys.has((0, integration_tools_1.buildIntegrationConnectionId)(integration))) {
                await this.disconnectChannel(agent.id, integration);
            }
        }
        const additions = nextExternal.filter((integration) => !previousKeys.has((0, integration_tools_1.buildIntegrationConnectionId)(integration)));
        if (additions.length > 0 && !agent.activeVersionId) {
            this.logger.debug('[ChatIntegrationService] Skipping connect for unpublished agent — entry persisted, will connect on publish', { agentId: agent.id, pendingTypes: additions.map((i) => i.type) });
            return;
        }
        for (const integration of additions) {
            const key = (0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agent.id, integration));
            if (this.connections.has(key))
                continue;
            try {
                await this.connect(agent.id, integration, agent.projectId);
                await this.broadcastIntegrationChange(agent.id, integration, 'connect');
            }
            catch (error) {
                this.logger.warn('[ChatIntegrationService] Could not connect integration during sync', {
                    agentId: agent.id,
                    type: integration.type,
                    credentialId: integration.credentialId,
                    error,
                });
            }
        }
    }
    getChatInstance(agentId, integration) {
        if (integration) {
            return this.connections.get((0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agentId, integration)))?.chat;
        }
        return this.findConnection(agentId)?.chat;
    }
    getBridge(agentId, integrationType, credentialId) {
        if (credentialId !== undefined) {
            return this.connections.get((0, agent_channel_1.agentChannelKey)({ agentId, integrationType, credentialId }))
                ?.bridge;
        }
        return this.findConnection(agentId, integrationType, (c) => c.bridge !== undefined)?.bridge;
    }
    acquireQueueBridge(agentId, integrationType, credentialId) {
        const connection = this.connections.get((0, agent_channel_1.agentChannelKey)({ agentId, integrationType, credentialId }));
        if (!connection?.bridge || connection.disconnecting)
            return undefined;
        const done = (0, deferred_promise_1.createDeferredPromise)();
        connection.queueConsumers ??= new Set();
        connection.queueConsumers.add(done.promise);
        return {
            bridge: connection.bridge,
            release: () => {
                connection.queueConsumers?.delete(done.promise);
                done.resolve();
            },
        };
    }
    findConnection(agentId, integrationType, predicate) {
        const prefix = integrationType ? `${agentId}:${integrationType}:` : `${agentId}:`;
        for (const [key, connection] of this.connections) {
            if (key.startsWith(prefix) && (predicate?.(connection) ?? true))
                return connection;
        }
        return undefined;
    }
    isChannelLive(agentId, integration) {
        if (this.shouldRouteToLeader(integration.type, true))
            return true;
        return this.getChatInstance(agentId, integration) !== undefined;
    }
    async getChatInstanceForTools(agentId, integration) {
        const live = this.getChatInstance(agentId, integration);
        if (live)
            return live;
        const key = (0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agentId, integration));
        const handleInitializationError = (error) => this.reportOutboundError(agentId, integration, error);
        const agent = await this.agentRepository
            .findOne({ where: { id: agentId } })
            .catch(handleInitializationError);
        const persistedIntegration = agent?.integrations?.find((candidate) => candidate.type === integration.type && candidate.credentialId === integration.credentialId);
        const ingressOwnedByLeader = this.shouldRouteToLeader(integration.type, true);
        if (!agent ||
            !(0, agent_entity_1.isProjectAgent)(agent) ||
            !persistedIntegration ||
            (agent.activeVersionId !== null && !ingressOwnedByLeader)) {
            await this.disconnectOutboundOne(key);
            return undefined;
        }
        const currentLive = this.getChatInstance(agentId, integration);
        if (currentLive)
            return currentLive;
        const outbound = this.outboundConnections.get(key)?.chat;
        if (outbound)
            return outbound;
        return await this.initializeOutboundConnection(key, agent, persistedIntegration);
    }
    getShortenCallback(agentId, integration, metadata) {
        return this.connections
            .get((0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agentId, integration)))
            ?.bridge?.getShortenCallback(metadata);
    }
    getWebhookHandler(agentId, platform, connectionSelector) {
        const integration = this.integrationRegistry.get(platform);
        for (const [key, conn] of this.connections) {
            if (!key.startsWith(`${agentId}:${platform}:`))
                continue;
            if (connectionSelector !== undefined &&
                !integration?.matchesWebhookConnection?.(conn.context.credential, connectionSelector)) {
                continue;
            }
            return conn.chat.webhooks[platform];
        }
        return undefined;
    }
    listLiveChannels() {
        return [...this.connections.values()].map((conn) => conn.ref);
    }
    hasLiveChannel(ref) {
        return this.connections.has((0, agent_channel_1.agentChannelKey)(ref));
    }
    async startChannel(agent, integration) {
        const skipExternalHooks = !this.instanceSettings.isLeader;
        await this.connect(agent.id, integration, agent.projectId, this.connectOptionsFor(integration, skipExternalHooks));
    }
    async handleIntegrationChanged(payload) {
        const { agentId, integration, action } = payload;
        const { type, credentialId } = integration;
        if (action === 'disconnect') {
            await this.disconnectLocal(agentId, integration, { skipExternalHooks: true });
            return;
        }
        const definition = this.integrationRegistry.get(type);
        if (definition?.requiresLeader() && !this.instanceSettings.isLeader) {
            this.logger.debug(`[ChatIntegrationService] Ignoring connect for ${type} on agent ${agentId} — leader-only integration on follower`);
            return;
        }
        const key = (0, agent_channel_1.agentChannelKey)({ agentId, integrationType: type, credentialId });
        if (this.connections.has(key))
            return;
        const agent = await this.agentRepository.findOne({ where: { id: agentId } });
        if (!agent || !(0, agent_entity_1.isProjectAgent)(agent)) {
            this.logger.warn(`[ChatIntegrationService] Cannot connect ${type} — agent ${agentId} not found`);
            return;
        }
        try {
            const options = { skipExternalHooks: true };
            await this.connectLocal(agentId, integration, agent.projectId, options);
        }
        catch (error) {
            this.logger.error(`[ChatIntegrationService] Failed to connect ${type} for agent ${agentId} — credential not accessible to the project: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async handleLeaderChannelRequest(payload) {
        const { agentId, integration, action } = payload;
        const key = (0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agentId, integration));
        try {
            await this.runLeaderOperation(key, action, async () => await this.applyLeaderChannelRequest(payload, key));
            await this.leaderChannelRelay.respond(payload);
        }
        catch (error) {
            const failure = (0, ensure_error_1.ensureError)(error);
            this.logger.warn(`[ChatIntegrationService] Leader-only ${action} failed for ${key}: ${failure.message}`);
            await this.leaderChannelRelay.respond(payload, failure);
        }
    }
    shouldRouteToLeader(type, ingressEnabled) {
        return (this.globalConfig.multiMainSetup.enabled &&
            !this.instanceSettings.isLeader &&
            this.integrationRegistry.get(type)?.requiresLeader({ ingressEnabled }) === true);
    }
    async runLeaderOperation(key, action, operation) {
        const running = this.leaderOperations.get(key);
        if (running?.action === action)
            return await running.done;
        const previous = running?.done.catch(() => { });
        const entry = {
            action,
            done: (async () => {
                await previous;
                await operation();
            })(),
        };
        this.leaderOperations.set(key, entry);
        try {
            await entry.done;
        }
        finally {
            if (this.leaderOperations.get(key) === entry)
                this.leaderOperations.delete(key);
        }
    }
    async settleLeaderOperations(timeoutMs = leader_channel_relay_service_1.LEADER_CHANNEL_REQUEST_TIMEOUT_MS) {
        const running = [...this.leaderOperations.values()];
        if (running.length === 0)
            return;
        let expire;
        try {
            await Promise.race([
                Promise.allSettled(running.map(async ({ done }) => await done)),
                new Promise((resolve) => {
                    expire = setTimeout(resolve, timeoutMs);
                }),
            ]);
        }
        finally {
            clearTimeout(expire);
        }
    }
    async disconnectLocal(agentId, integration, options = {}) {
        const key = (0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(agentId, integration));
        await this.disconnectOne(key, options);
        await this.disconnectOutboundOne(key);
    }
    async disconnectOutboundOne(key) {
        await this.outboundConnectionInitializations.get(key);
        await this.disposeOutboundConnection(key);
    }
    async disposeOutboundConnection(key) {
        const conn = this.outboundConnections.get(key);
        if (!conn)
            return;
        try {
            await conn.chat.shutdown();
        }
        catch (error) {
            this.logger.warn(`[ChatIntegrationService] Error during outbound shutdown for ${key}: ${error instanceof Error ? error.message : String(error)}`);
        }
        this.outboundConnections.delete(key);
        await this.runDisconnectedHook(this.integrationFromConnectionKey(key), conn.context, `outbound ${key}`);
        this.logger.info(`[ChatIntegrationService] Outbound disconnected: ${key}`);
    }
    async disconnectOne(key, options = {}) {
        const conn = this.connections.get(key);
        if (!conn)
            return;
        conn.disconnecting = true;
        if (conn.queueConsumers)
            await Promise.all(conn.queueConsumers);
        if (!options.skipExternalHooks)
            await this.runBeforeDisconnectHook(key, conn.context);
        try {
            await conn.chat.shutdown();
        }
        catch (error) {
            this.logger.warn(`[ChatIntegrationService] Error during shutdown for ${key}: ${error instanceof Error ? error.message : String(error)}`);
        }
        this.connections.delete(key);
        await this.runDisconnectedHook(this.integrationFromConnectionKey(key), conn.context, key);
        await this.statusReporter.withdraw(conn.ref);
        this.logger.info(`[ChatIntegrationService] Disconnected: ${key}`);
    }
    async runDisconnectedHook(integration, context, label) {
        if (!integration?.onDisconnected)
            return;
        try {
            await integration.onDisconnected(context);
        }
        catch (error) {
            this.logger.warn(`[ChatIntegrationService] onDisconnected failed for ${label}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async decryptCredentialForProject(credentialId, projectId) {
        const projectCredentials = await this.credentialsService.findAllCredentialIdsForProject(projectId);
        const globalCredentials = await this.credentialsService.findAllGlobalCredentialIds(true);
        const credential = projectCredentials.find((c) => c.id === credentialId) ??
            globalCredentials.find((c) => c.id === credentialId);
        if (!credential) {
            throw new Error(`Credential ${credentialId} not found or not accessible to project ${projectId}`);
        }
        const decrypted = await this.credentialsService.decrypt(credential, true);
        return decrypted;
    }
    buildWebhookUrl(agentId, projectId, platform) {
        const base = this.urlService.getWebhookBaseUrl();
        return `${base}rest/projects/${projectId}/agents/v2/${agentId}/webhooks/${platform}`;
    }
    connectOptionsFor(integration, skipExternalHooks) {
        return 'settings' in integration
            ? { skipExternalHooks, settings: integration.settings }
            : { skipExternalHooks };
    }
    async createConnectionContext(agentId, projectId, integration, ingressEnabled) {
        const decryptedData = await this.decryptCredentialForProject(integration.credentialId, projectId);
        return {
            agentId,
            projectId,
            integration,
            credentialId: integration.credentialId,
            credential: decryptedData,
            ingressEnabled,
            webhookUrlFor: (platform) => this.buildWebhookUrl(agentId, projectId, platform),
        };
    }
    async initializeConnection(ctx, integrationImpl, options, key) {
        const { agentId, integration, ingressEnabled } = ctx;
        let state;
        let chat;
        let bridge;
        let initializeStarted = false;
        try {
            const adapter = (0, recording_adapter_1.recordAdapterCalls)(integration.type, await integrationImpl.createAdapter(ctx));
            channel_integration_recorder_1.channelIntegrationRecorder.startFetchRecording();
            const { Chat } = await (0, esm_loader_1.loadChatSdk)();
            const { createMemoryState } = await (0, esm_loader_1.loadMemoryState)();
            const memoryState = createMemoryState();
            state = ingressEnabled
                ? this.chatSubscriptionStateService.createStateAdapter({
                    agentId,
                    integration,
                    delegate: memoryState,
                })
                : memoryState;
            chat = new Chat({
                concurrency: 'concurrent',
                userName: `n8n-agent-${agentId}`,
                adapters: { [integration.type]: adapter },
                state,
                ...streamingOptionsFor(integration.type),
            });
            if (ingressEnabled)
                bridge = await this.createChatBridge(chat, ctx);
            initializeStarted = true;
            await chat.initialize();
            if (ingressEnabled && integrationImpl.onAfterConnect && !options.skipExternalHooks) {
                await integrationImpl.onAfterConnect(ctx);
            }
            if (this.shuttingDown) {
                throw new n8n_workflow_1.OperationalError('This instance started shutting down while the channel was starting up');
            }
        }
        catch (error) {
            await this.cleanupFailedConnection(chat, state, initializeStarted);
            await this.runDisconnectedHook(integrationImpl, ctx, `${key} after failed connect`);
            throw error;
        }
        return { chat: chat, bridge };
    }
    async createChatBridge(chat, ctx) {
        const { agentId, projectId, integration } = ctx;
        const componentMapper = new component_mapper_1.ComponentMapper();
        const agentExecutionOrchestratorService = await getAgentExecutionOrchestratorService();
        return agent_chat_bridge_1.AgentChatBridge.create(chat, agentId, agentExecutionOrchestratorService, componentMapper, this.logger, projectId, integration);
    }
    async cleanupFailedConnection(chat, state, initializeStarted) {
        if (initializeStarted) {
            await chat.shutdown().catch((shutdownError) => {
                this.logger.warn(`[ChatIntegrationService] Shutdown after failed connect threw: ${shutdownError instanceof Error ? shutdownError.message : String(shutdownError)}`);
            });
        }
        else {
            await state?.disconnect().catch((disconnectError) => {
                this.logger.warn(`[ChatIntegrationService] State cleanup after failed setup threw: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
            });
        }
    }
    async runConnectedHook(integrationImpl, ctx, key) {
        if (!integrationImpl.onConnected)
            return;
        try {
            await integrationImpl.onConnected(ctx);
        }
        catch (error) {
            this.logger.warn(`[ChatIntegrationService] onConnected failed for ${key}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    reportOutboundError(agentId, integration, error) {
        this.logger.warn('[ChatIntegrationService] Could not initialize outbound integration for Preview', {
            agentId,
            type: integration.type,
            credentialId: integration.credentialId,
            error,
        });
        return undefined;
    }
    async initializeOutboundConnection(key, agent, integration) {
        const agentId = agent.id;
        const handleInitializationError = (error) => this.reportOutboundError(agentId, integration, error);
        const pending = this.outboundConnectionInitializations.get(key);
        if (pending)
            return await pending;
        const initialization = this.connect(agentId, integration, agent.projectId, {
            ingressEnabled: false,
        })
            .then(() => this.outboundConnections.get(key)?.chat)
            .catch(handleInitializationError);
        this.outboundConnectionInitializations.set(key, initialization);
        try {
            return await initialization;
        }
        finally {
            if (this.outboundConnectionInitializations.get(key) === initialization) {
                this.outboundConnectionInitializations.delete(key);
            }
        }
    }
    async applyLeaderChannelRequest({ agentId, integration, action }, key) {
        if (action === 'disconnect') {
            await this.disconnectLocal(agentId, integration);
            return;
        }
        const agent = await this.agentRepository.findOne({ where: { id: agentId } });
        if (!agent || !(0, agent_entity_1.isProjectAgent)(agent)) {
            throw new n8n_workflow_1.UnexpectedError(`Agent ${agentId} not found on the leader instance`);
        }
        await this.connectLocal(agentId, integration, agent.projectId);
        if (!this.instanceSettings.isLeader) {
            await this.disconnectOne(key, { skipExternalHooks: true });
            throw new n8n_workflow_1.OperationalError('This instance stopped being the leader while the channel was starting up');
        }
    }
    async runBeforeDisconnectHook(key, context) {
        const integration = this.integrationFromConnectionKey(key);
        if (!integration?.onBeforeDisconnect)
            return;
        try {
            await integration.onBeforeDisconnect(context);
        }
        catch (error) {
            this.logger.warn(`[ChatIntegrationService] onBeforeDisconnect failed for ${key}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
exports.ChatIntegrationService = ChatIntegrationService;
__decorate([
    (0, decorators_1.OnShutdown)(constants_2.LOWEST_SHUTDOWN_PRIORITY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatIntegrationService.prototype, "disconnectAll", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatIntegrationService.prototype, "disconnectLeaderOnlyIntegrations", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('agent-chat-integration-changed', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatIntegrationService.prototype, "handleIntegrationChanged", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('agent-chat-leader-channel-request', {
        instanceType: 'main',
        instanceRole: 'leader',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatIntegrationService.prototype, "handleLeaderChannelRequest", null);
exports.ChatIntegrationService = ChatIntegrationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, credentials_service_1.CredentialsService, backend_services_1.UrlService, agent_chat_integration_1.ChatIntegrationRegistry, n8n_core_1.InstanceSettings, agent_change_publisher_service_1.AgentChangePublisher, config_1.GlobalConfig, agent_chat_subscription_state_service_1.AgentChatSubscriptionStateService, agent_channel_status_reporter_1.AgentChannelStatusReporter, leader_channel_relay_service_1.LeaderChannelRelayService])
], ChatIntegrationService);
//# sourceMappingURL=chat-integration.service.js.map