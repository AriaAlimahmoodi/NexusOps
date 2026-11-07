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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordIntegration = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const escapeRegExp_1 = __importDefault(require("lodash/escapeRegExp"));
const n8n_core_1 = require("n8n-core");
const errors_1 = require("@n8n/errors");
const agent_repository_1 = require("../../repositories/agent.repository");
const agent_chat_integration_1 = require("../agent-chat-integration");
const adapter_logger_1 = require("../adapter-logger");
const credential_fields_1 = require("../credential-fields");
const component_mapper_1 = require("../component-mapper");
const credential_claim_1 = require("../credential-claim");
const esm_loader_1 = require("../esm-loader");
const integration_tool_definitions_1 = require("../integration-tool-definitions");
const discord_gateway_1 = require("./discord-gateway");
const discord_operations_1 = require("./discord-operations");
const typing_indicator_1 = require("./typing-indicator");
const DISCORD_TYPING_REFRESH_MS = 8000;
const DISCORD_API_URL = 'https://discord.com/api/v10';
let DiscordIntegration = class DiscordIntegration extends agent_chat_integration_1.AgentChatIntegration {
    resolveWebhookRequest(request) {
        if (request.headers['x-discord-gateway-token'] !== undefined) {
            return { type: 'reject', response: { status: 404, body: { error: 'Not found' } } };
        }
        if (!(0, is_record_1.isRecord)(request.body) || typeof request.body.application_id !== 'string') {
            return { type: 'no_match' };
        }
        return { type: 'select', connectionSelector: request.body.application_id };
    }
    matchesWebhookConnection(credential, connectionSelector) {
        const applicationId = credential.applicationId;
        return typeof applicationId === 'string' && applicationId.trim() === connectionSelector;
    }
    constructor(logger, instanceSettings, agentRepository, outboundHttp) {
        super();
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.type = 'discord';
        this.credentialTypes = ['discordBotApi'];
        this.displayLabel = 'Discord';
        this.displayIcon = 'discord';
        this.builderGuidance = {
            capabilities: [
                'Receive Discord mentions and direct messages as agent triggers.',
                'Respond in Discord channels, threads, and direct messages.',
                'Edit existing messages and add emoji reactions in the current Discord conversation.',
                'Render Discord embeds with buttons.',
            ],
            useIntegrationWhen: [
                'The agent should be chatted with from Discord or act as a Discord bot.',
                'The agent needs to reply to Discord users in the same conversation context.',
                'The agent needs to update or react to a Discord message in the current conversation.',
                'The agent should send Discord messages as the connected Discord bot.',
                'A scheduled Agent task should proactively send a DM or channel message through the connected Discord bot.',
            ],
            useNodeToolWhen: [
                'Discord is only a backend API step and the agent does not need to be connected as a Discord chat surface.',
                'The Discord operation is performed by a non-Agent workflow, or the exact operation is not listed in the Agent integration capabilities.',
            ],
        };
        this.supportedComponents = [
            'section',
            'button',
            'divider',
            'fields',
            'image',
        ];
        this.actionToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)([
            'respond',
            'send_dm',
            'send_channel_message',
            'edit_message',
            'add_reaction',
            'do_not_respond',
        ]);
        this.contextToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationContextQueryDefinitions)([
            'get_current_message_context',
            'get_current_subject',
            'search_channels',
        ]);
        this.contextToolGuidance = [
            'Use search_channels to turn a channel name such as "general" into a channel ID. The same name can appear in more than one server — guildName tells them apart. When the result includes nextCursor, pass it back to continue searching the bot’s remaining servers.',
        ];
        this.actionToolGuidance = [
            'For scheduled tasks without an inbound conversation, use send_dm or send_channel_message with the known destination ID. These actions do not require current message context.',
            'For edit_message, pass the messageId returned by a previous Discord action or get_current_message_context. The current Discord conversation is selected automatically.',
            'For send_channel_message, channelId must be shaped "discord:<guildId>:<channelId>" — pass the value returned by search_channels or get_current_message_context. A bare Discord channel ID copied from the Discord app is rejected.',
            'A Discord mention is answered inside a thread created off that message. Use send_channel_message when the reply belongs in the channel itself rather than that thread.',
        ];
        this.needsShortCallbackData = true;
        this.disableStreaming = true;
        this.deleteActionMessageBeforeResume = false;
        this.pendingConnections = new Map();
        this.gateway = new discord_gateway_1.DiscordGateway(logger, instanceSettings);
        this.httpClient = outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
        });
    }
    async assertStartupPreconditions(ctx) {
        await (0, credential_claim_1.assertCredentialNotClaimed)(this.agentRepository, this.displayLabel, this.type, ctx);
    }
    async onBeforeConnect(ctx) {
        await this.assertStartupPreconditions(ctx);
        await this.validateDiscordCredential(ctx);
    }
    async createAdapter(ctx) {
        const botToken = this.extractBotToken(ctx.credential);
        const publicKey = this.extractPublicKey(ctx.credential);
        const applicationId = this.extractApplicationId(ctx.credential);
        const { createDiscordAdapter } = await (0, esm_loader_1.loadDiscordAdapter)();
        this.assertBotTokenAvailable(this.sessionKey(ctx), botToken);
        const adapter = createDiscordAdapter({
            botToken,
            publicKey,
            applicationId,
            mentionRoleIds: [],
            apiUrl: DISCORD_API_URL,
            logger: (0, adapter_logger_1.createAdapterLogger)(this.logger, '[DiscordAdapter]'),
        });
        this.pendingConnections.set(this.sessionKey(ctx), {
            adapter,
            botToken,
        });
        return adapter;
    }
    async onConnected(ctx) {
        const key = this.sessionKey(ctx);
        const connection = this.pendingConnections.get(key);
        this.pendingConnections.delete(key);
        if (!connection)
            return;
        await this.gateway.discard(key);
        this.gateway.register(key, {
            ...connection,
            ingressEnabled: ctx.ingressEnabled,
        });
    }
    async onDisconnected(ctx) {
        const key = this.sessionKey(ctx);
        this.pendingConnections.delete(key);
        await this.gateway.discard(key);
    }
    async settleActionMessage(params) {
        const botToken = this.gateway.botTokenFor(`${params.agentId}:${params.integration.credentialId}`);
        if (!botToken) {
            throw new Error('Discord connection is not available to settle the action card');
        }
        await (0, discord_operations_1.settleDiscordActionMessage)({
            httpClient: this.httpClient,
            apiUrl: DISCORD_API_URL,
            botToken,
            threadId: params.threadId,
            messageId: params.messageId,
            content: params.content,
        });
    }
    shouldSubscribeToNewMention({ thread }) {
        const parts = thread.id.split(':');
        if (parts[0] !== 'discord' || parts.length < 3)
            return true;
        if (parts[1] === '@me')
            return true;
        return Boolean(parts[3]);
    }
    getReplyExpectation(params) {
        if (params.isNewMention || params.message.isMention === true)
            return 'required';
        const parts = params.message.threadId.split(':');
        const isGuildThread = parts[0] === 'discord' && Boolean(parts[1] && parts[1] !== '@me' && parts[2] && parts[3]);
        return isGuildThread ? 'optional' : 'required';
    }
    async executeContextQuery(params) {
        const { agentId, integration } = params.descriptor;
        const botToken = this.gateway.botTokenFor(`${agentId}:${integration.credentialId}`);
        return await (0, discord_operations_1.executeDiscordContextQuery)({
            httpClient: this.httpClient,
            apiUrl: DISCORD_API_URL,
            botToken,
            query: params.query,
            input: params.input,
        });
    }
    startAllGateways() {
        this.gateway.startAll();
    }
    async stopAllGateways() {
        await this.gateway.pauseAll();
    }
    getPlatformAgentContext(chat) {
        const adapter = chat.getAdapter(this.type);
        if (!(0, is_record_1.isRecord)(adapter))
            return {};
        const agentUserId = adapter.botUserId;
        return typeof agentUserId === 'string' && agentUserId ? { agentUserId } : {};
    }
    prepareInboundText(text, context) {
        const trimmed = text.trim();
        if (!context.agentUserId)
            return trimmed;
        return stripDiscordSelfMention(trimmed, context.agentUserId);
    }
    async createBridgeExecutionContext(params) {
        return {
            platformAgentContext: this.getPlatformAgentContext(params.chat),
            statusHandle: params.replyExpectation === 'optional' || params.startStatus === false
                ? undefined
                : this.startTyping(params.thread, params.logger, params.agentId),
        };
    }
    async createResumeExecutionContext(params) {
        return {
            statusHandle: this.startTyping(params.thread, params.logger, params.agentId),
        };
    }
    startTyping(thread, logger, agentId) {
        return (0, typing_indicator_1.startTypingIndicator)(thread, {
            logger,
            agentId,
            platform: 'Discord',
            refreshMs: DISCORD_TYPING_REFRESH_MS,
        });
    }
    formatActionDecisionMessage({ approved, selectedLabel, raw, user, }) {
        const responder = user.fullName || user.userName || user.userId;
        const outcome = approved === undefined
            ? `✅ ${selectedLabel || 'Action'} selected by ${responder}`
            : approved
                ? `✅ Approved by ${responder}`
                : `🚫 Declined by ${responder}`;
        const originalText = this.extractCardText(raw);
        return originalText ? `${originalText}\n\n${outcome}` : outcome;
    }
    normalizeComponents(components) {
        return (0, component_mapper_1.expandSelectsToButtons)(components);
    }
    sessionKey(ctx) {
        return `${ctx.agentId}:${ctx.credentialId}`;
    }
    assertBotTokenAvailable(sessionKey, botToken) {
        for (const [key, connection] of this.pendingConnections) {
            if (key === sessionKey)
                continue;
            if (connection.botToken === botToken) {
                throw new errors_1.ConflictError('This Discord bot token is already connected to another agent on this instance');
            }
        }
        if (this.gateway.sessionKeyUsingBotToken(botToken, sessionKey)) {
            throw new errors_1.ConflictError('This Discord bot token is already connected to another agent on this instance');
        }
    }
    async validateDiscordCredential(ctx) {
        const botToken = this.extractBotToken(ctx.credential);
        const publicKey = this.extractPublicKey(ctx.credential);
        const applicationId = this.extractApplicationId(ctx.credential);
        const result = await (0, discord_operations_1.fetchDiscordApplicationMetadata)({
            httpClient: this.httpClient,
            apiUrl: DISCORD_API_URL,
            botToken,
        });
        if (!result.ok) {
            if (result.kind === 'http' && (result.status === 401 || result.status === 403)) {
                throw new errors_1.BadRequestError('The Discord Bot Token was rejected. Check that the token is correct and has not been regenerated.');
            }
            throw new errors_1.BadRequestError('Discord did not return application metadata for this bot token. Verify the Application ID, Public Key, and Bot Token belong to the same Discord application.');
        }
        if (result.application.id !== applicationId) {
            throw new errors_1.BadRequestError('The Discord Application ID does not match this bot token. Copy the Application ID from the same Discord application that issued the token.');
        }
        if (result.application.verify_key.toLowerCase() !== publicKey.toLowerCase()) {
            throw new errors_1.BadRequestError('The Discord Public Key does not match this bot token. Copy the Public Key from the same Discord application that issued the token.');
        }
    }
    extractBotToken(credential) {
        return (0, credential_fields_1.requireCredentialField)(credential, 'botToken', 'The Discord credential is missing a Bot Token. Copy it from the Bot section of the Discord Developer Portal.');
    }
    extractPublicKey(credential) {
        return (0, credential_fields_1.requireCredentialField)(credential, 'publicKey', 'The Discord credential is missing a Public Key. Copy it from the application General Information page in the Discord Developer Portal.');
    }
    extractApplicationId(credential) {
        return (0, credential_fields_1.requireCredentialField)(credential, 'applicationId', 'The Discord credential is missing an Application ID. Copy it from the application General Information page in the Discord Developer Portal.');
    }
    extractCardText(raw) {
        if (!(0, is_record_1.isRecord)(raw) || !(0, is_record_1.isRecord)(raw.message))
            return '';
        const { content, embeds } = raw.message;
        if (typeof content === 'string' && content)
            return content;
        if (Array.isArray(embeds)) {
            const [firstEmbed] = embeds;
            if ((0, is_record_1.isRecord)(firstEmbed) && typeof firstEmbed.description === 'string') {
                return firstEmbed.description;
            }
        }
        return '';
    }
};
exports.DiscordIntegration = DiscordIntegration;
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DiscordIntegration.prototype, "startAllGateways", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DiscordIntegration.prototype, "stopAllGateways", null);
exports.DiscordIntegration = DiscordIntegration = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, agent_repository_1.AgentRepository, backend_network_1.OutboundHttp])
], DiscordIntegration);
function stripDiscordSelfMention(text, userId) {
    return text
        .replace(new RegExp(`(^|\\s)<@!?${(0, escapeRegExp_1.default)(userId)}>`, 'g'), '$1')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=discord-integration.js.map