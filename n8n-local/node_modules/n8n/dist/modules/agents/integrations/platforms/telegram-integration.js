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
exports.TelegramIntegration = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const crypto_1 = require("crypto");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const agent_repository_1 = require("../../repositories/agent.repository");
const agent_chat_integration_1 = require("../agent-chat-integration");
const credential_claim_1 = require("../credential-claim");
const esm_loader_1 = require("../esm-loader");
const integration_tool_definitions_1 = require("../integration-tool-definitions");
const telegram_bridge_behavior_1 = require("./telegram-bridge-behavior");
let TelegramIntegration = class TelegramIntegration extends agent_chat_integration_1.AgentChatIntegration {
    formatActionDecisionMessage({ approved, selectedLabel, raw, user, }) {
        const originalText = (0, is_record_1.isRecord)(raw) && (0, is_record_1.isRecord)(raw.message) && typeof raw.message.text === 'string'
            ? raw.message.text
            : '';
        const responder = user.fullName || user.userName || user.userId;
        const outcome = approved === undefined
            ? `✅ ${selectedLabel || 'Action'} selected by ${responder}`
            : approved
                ? `✅ Approved by ${responder}`
                : `🚫 Declined by ${responder}`;
        return originalText ? `${originalText}\n\n${outcome}` : outcome;
    }
    constructor(logger, urlService, agentRepository, instanceSettings, outboundHttp) {
        super();
        this.logger = logger;
        this.urlService = urlService;
        this.agentRepository = agentRepository;
        this.instanceSettings = instanceSettings;
        this.outboundHttp = outboundHttp;
        this.type = 'telegram';
        this.credentialTypes = ['telegramApi'];
        this.displayLabel = 'Telegram';
        this.displayIcon = 'telegram';
        this.builderGuidance = {
            capabilities: [
                'Receive Telegram messages as agent triggers.',
                'Receive Telegram photos and expose their chat and file identifiers to the agent.',
                'Respond in Telegram conversations and send direct Telegram messages.',
                'Edit existing messages in the current Telegram conversation.',
                'Render Telegram-compatible cards with buttons.',
            ],
            useIntegrationWhen: [
                'The agent should be chatted with from Telegram or act as a Telegram bot.',
                'The agent needs to reply to Telegram users in the same conversation context.',
                'The agent needs to update a Telegram message in the current conversation.',
                'The agent should send Telegram messages as the connected Telegram bot.',
                'A scheduled Agent task should proactively send a direct message to a known Telegram user ID.',
            ],
            useNodeToolWhen: [
                'Telegram is only a backend API step and the agent does not need to be connected as a Telegram chat surface.',
                'The Telegram operation is performed by a non-Agent workflow, or the exact operation is not listed in the Agent integration capabilities.',
            ],
        };
        this.supportedComponents = [
            'section',
            'button',
            'divider',
            'fields',
        ];
        this.actionToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)([
            'respond',
            'send_dm',
            'edit_message',
        ]);
        this.contextToolGuidance = [
            'For an inbound Telegram message, get_current_message_context returns context.platformMessage. It contains chat_id, message_id, optional message_thread_id, and attachment file_id values.',
        ];
        this.actionToolGuidance = [
            'For scheduled tasks without an inbound conversation, use send_dm with the known Telegram user ID. The integration action does not require current message context.',
            'For edit_message, pass the messageId returned by a previous Telegram action or get_current_message_context. The current Telegram conversation is selected automatically.',
        ];
        this.needsShortCallbackData = true;
        this.deleteActionMessageBeforeResume = false;
        this.disableStreaming = true;
        this.formatThreadId = {
            fromSdk: (thread) => {
                const adapter = thread.adapter;
                const botUserId = adapter.botUserId;
                if (!botUserId) {
                    throw new Error('Telegram bot user ID is not set');
                }
                return `chat:${botUserId}-${thread.id}`;
            },
            toSdk: (threadId) => {
                if (!threadId.includes('-')) {
                    return threadId;
                }
                return threadId.split('-').slice(1).join('-');
            },
        };
    }
    async createAdapter(ctx) {
        const botToken = this.extractBotToken(ctx.credential);
        const mode = ctx.ingressEnabled ? this.getMode() : 'webhook';
        const secretToken = this.deriveSecretToken(ctx.agentId, ctx.credentialId);
        const { createTelegramAdapter } = await (0, esm_loader_1.loadTelegramAdapter)();
        return createTelegramAdapter({ botToken, mode, secretToken });
    }
    validateConfig(integration) {
        if (integration.type === this.type && !integration.settings) {
            throw new errors_1.BadRequestError('Telegram integration settings are required');
        }
    }
    requiresLeader({ ingressEnabled } = { ingressEnabled: true }) {
        return ingressEnabled && this.getMode() === 'polling';
    }
    async assertStartupPreconditions(ctx) {
        await (0, credential_claim_1.assertCredentialNotClaimed)(this.agentRepository, this.displayLabel, this.type, ctx);
    }
    async onBeforeConnect(ctx) {
        await this.assertStartupPreconditions(ctx);
    }
    async onAfterConnect(ctx) {
        if (this.getMode() !== 'webhook')
            return;
        const webhookUrl = ctx.webhookUrlFor('telegram');
        const secretToken = this.deriveSecretToken(ctx.agentId, ctx.credentialId);
        const response = await this.botApiRequest(ctx.credential, 'setWebhook', {
            url: webhookUrl,
            secret_token: secretToken,
        });
        if (!this.isOkStatus(response.statusCode)) {
            throw new Error(`Failed to register Telegram webhook: ${this.stringifyBody(response.body)}`);
        }
        this.logger.info(`[TelegramIntegration] Webhook registered: ${webhookUrl}`);
    }
    async onBeforeDisconnect(ctx) {
        if (this.getMode() !== 'webhook')
            return;
        const response = await this.botApiRequest(ctx.credential, 'deleteWebhook');
        if (!this.isOkStatus(response.statusCode)) {
            throw new Error(`Failed to deregister Telegram webhook: ${this.stringifyBody(response.body)}`);
        }
        this.logger.info(`[TelegramIntegration] Webhook deregistered for agent ${ctx.agentId}, credential ${ctx.credentialId}`);
    }
    isUserAllowed(author, integration) {
        if (!integration)
            return true;
        if (integration?.type !== 'telegram') {
            throw new n8n_workflow_1.UnexpectedError(`TelegramIntegration received settings with type "${integration?.type}"`);
        }
        if (!integration.settings)
            return true;
        if (integration.settings.accessMode === 'public')
            return true;
        return integration.settings.allowedUsers.some((allowed) => {
            const normalized = allowed.startsWith('@') ? allowed.slice(1) : allowed;
            return normalized === author.userId || normalized === author.userName;
        });
    }
    async createBridgeExecutionContext(params) {
        return await Promise.resolve((0, telegram_bridge_behavior_1.createTelegramBridgeExecutionContext)(params));
    }
    async createResumeExecutionContext(params) {
        return await Promise.resolve((0, telegram_bridge_behavior_1.createTelegramResumeExecutionContext)(params));
    }
    normalizeComponents(components) {
        const normalized = [];
        for (const c of components) {
            switch (c.type) {
                case 'select':
                case 'radio_select':
                    for (const opt of c.options ?? []) {
                        normalized.push({ type: 'button', label: opt.label, value: opt.value });
                    }
                    break;
                case 'image':
                    if (c.url) {
                        normalized.push({ type: 'section', text: `[${c.altText ?? 'Image'}](${c.url})` });
                    }
                    break;
                default:
                    normalized.push(c);
            }
        }
        return normalized;
    }
    getMode() {
        const baseUrl = this.urlService.getWebhookBaseUrl();
        const isPublic = baseUrl.startsWith('https://') && !baseUrl.includes('localhost');
        return isPublic ? 'webhook' : 'polling';
    }
    deriveSecretToken(agentId, credentialId) {
        return (0, crypto_1.createHmac)('sha256', this.instanceSettings.encryptionKey)
            .update(`telegram:${agentId}:${credentialId}`)
            .digest('hex');
    }
    extractBotToken(credential) {
        const token = credential.accessToken;
        if (typeof token === 'string' && token) {
            return token;
        }
        throw new Error('Could not extract a bot token from the Telegram credential. ' +
            'Please ensure the credential has a valid access token from BotFather.');
    }
    botApiUrl(credential, method) {
        const botToken = this.extractBotToken(credential);
        const raw = credential.baseUrl;
        const baseUrl = typeof raw === 'string' && raw.trim()
            ? raw.trim().replace(/\/+$/, '')
            : 'https://api.telegram.org';
        return `${baseUrl}/bot${botToken}/${method}`;
    }
    async botApiRequest(credential, method, body) {
        return await this.outboundHttp
            .requests()
            .request({
            method: 'POST',
            url: this.botApiUrl(credential, method),
            ...(body ? { body, json: true } : {}),
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        });
    }
    isOkStatus(statusCode) {
        return statusCode >= 200 && statusCode < 300;
    }
    stringifyBody(body) {
        return typeof body === 'string' ? body : JSON.stringify(body);
    }
};
exports.TelegramIntegration = TelegramIntegration;
exports.TelegramIntegration = TelegramIntegration = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.UrlService, agent_repository_1.AgentRepository, n8n_core_1.InstanceSettings, backend_network_1.OutboundHttp])
], TelegramIntegration);
//# sourceMappingURL=telegram-integration.js.map