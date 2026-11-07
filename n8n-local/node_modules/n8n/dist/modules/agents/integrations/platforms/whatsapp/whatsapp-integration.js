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
exports.WhatsAppIntegration = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const agent_repository_1 = require("../../../repositories/agent.repository");
const agent_chat_integration_1 = require("../../agent-chat-integration");
const channel_rate_limit_1 = require("../../channel-rate-limit");
const channel_rate_limit_guard_1 = require("../../channel-rate-limit.guard");
const component_mapper_1 = require("../../component-mapper");
const credential_claim_1 = require("../../credential-claim");
const esm_loader_1 = require("../../esm-loader");
const integration_helpers_1 = require("../../integration-helpers");
const integration_tool_definitions_1 = require("../../integration-tool-definitions");
const integration_tool_factory_1 = require("../../integration-tool-factory");
const typing_indicator_1 = require("../typing-indicator");
const whatsapp_webhook_verification_store_1 = require("./whatsapp-webhook-verification.store");
const WHATSAPP_CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
const WHATSAPP_DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES = 30;
const WHATSAPP_MAX_REPLY_BUTTONS = 3;
const WHATSAPP_TYPING_REFRESH_MS = 20 * 1000;
const WHATSAPP_BOT_USER_NAME = 'n8n-agent';
const WHATSAPP_RATE_LIMIT_ERROR_CODES = new Set([130429, 131048, 131056, 80007]);
const WHATSAPP_PAIR_RATE_LIMIT_CODE = 131056;
const WHATSAPP_RATE_LIMIT_MAX_ATTEMPTS = 4;
const WHATSAPP_RATE_LIMIT_BACKOFF_BASE_MS = 1_000;
const WHATSAPP_RATE_LIMIT_BACKOFF_CAP_MS = 8_000;
let WhatsAppIntegration = class WhatsAppIntegration extends agent_chat_integration_1.AgentChatIntegration {
    constructor(logger, agentRepository, instanceSettings, channelRateLimitGuard, webhookVerification) {
        super();
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.instanceSettings = instanceSettings;
        this.channelRateLimitGuard = channelRateLimitGuard;
        this.webhookVerification = webhookVerification;
        this.type = 'whatsapp';
        this.credentialTypes = ['whatsAppBotApi'];
        this.displayLabel = 'WhatsApp';
        this.displayIcon = 'whatsapp';
        this.internal = true;
        this.builderGuidance = {
            capabilities: [
                'Receive WhatsApp messages as agent triggers.',
                'Respond in the current WhatsApp conversation and send direct WhatsApp messages.',
                'Add or remove emoji reactions on a WhatsApp message.',
                'Render WhatsApp-compatible cards with reply buttons or list messages.',
            ],
            useIntegrationWhen: [
                'The agent should be chatted with from WhatsApp or act as a WhatsApp Business bot.',
                'The agent needs to reply to a WhatsApp customer in the same 1:1 conversation.',
                'A scheduled Agent task should proactively message a known WhatsApp customer, within the 24-hour customer service window.',
            ],
            useNodeToolWhen: [
                'WhatsApp is only a backend API step and the agent does not need to be connected as a WhatsApp chat surface.',
                'The WhatsApp operation is performed by a non-Agent workflow, or the exact operation is not listed in the Agent integration capabilities.',
                'The message must reach a customer outside the 24-hour window — that requires a pre-approved template message, which this integration does not send.',
            ],
        };
        this.supportedComponents = [
            'section',
            'button',
            'select',
            'radio_select',
            'divider',
            'fields',
        ];
        this.actionToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)([
            'respond',
            'send_dm',
            'add_reaction',
        ]);
        this.actionToolGuidance = [
            'For scheduled tasks without an inbound conversation, use send_dm with the known WhatsApp user ID (the customer phone number, WhatsApp "wa_id" format). This still fails outside the 24-hour customer service window.',
            'WhatsApp has no group conversations — every thread is a 1:1 DM.',
        ];
        this.disableStreaming = true;
        this.deleteActionMessageBeforeResume = false;
        this.defaultSessionIdleTimeoutMinutes = WHATSAPP_DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES;
    }
    async assertStartupPreconditions(ctx) {
        await (0, credential_claim_1.assertCredentialNotClaimed)(this.agentRepository, this.displayLabel, this.type, ctx);
    }
    async onBeforeConnect(ctx) {
        await this.assertStartupPreconditions(ctx);
    }
    async onRemove(ctx) {
        await this.webhookVerification.clear(ctx.agentId);
        return undefined;
    }
    handleUnauthenticatedWebhook(context) {
        if (context.method !== 'GET')
            return undefined;
        const mode = (0, integration_helpers_1.stringValue)(context.query['hub.mode']);
        const token = (0, integration_helpers_1.stringValue)(context.query['hub.verify_token']);
        const challenge = (0, integration_helpers_1.stringValue)(context.query['hub.challenge']);
        if (mode !== 'subscribe' || !token || !challenge)
            return undefined;
        if (token !== this.deriveVerifyToken(context.agentId)) {
            return { status: 403, body: 'Forbidden', raw: true };
        }
        void this.webhookVerification.markVerified(context.agentId);
        return { status: 200, body: challenge, raw: true };
    }
    async createResumeExecutionContext(params) {
        if (!whatsAppSettings(params.integration).typingIndicator)
            return {};
        return await Promise.resolve({
            statusHandle: (0, typing_indicator_1.startTypingIndicator)(params.thread, {
                logger: params.logger,
                agentId: params.agentId,
                platform: 'WhatsApp',
                refreshMs: WHATSAPP_TYPING_REFRESH_MS,
            }),
        });
    }
    shouldDownloadAttachments(integration) {
        return whatsAppSettings(integration).downloadMedia;
    }
    async createAdapter(ctx) {
        const config = {
            accessToken: this.extractAccessToken(ctx.credential),
            appSecret: this.extractAppSecret(ctx.credential),
            phoneNumberId: this.extractPhoneNumberId(ctx.credential),
            verifyToken: this.deriveVerifyToken(ctx.agentId),
            userName: WHATSAPP_BOT_USER_NAME,
            logger: this.createAdapterLogger(),
        };
        this.extractBusinessAccountId(ctx.credential);
        const [{ WhatsAppAdapter: AdapterClass }, sdk] = await Promise.all([
            (0, esm_loader_1.loadWhatsAppAdapter)(),
            (0, esm_loader_1.loadChatSdk)(),
        ]);
        const logger = this.logger;
        const channelRateLimitGuard = this.channelRateLimitGuard;
        const connectionId = (0, integration_tool_factory_1.buildIntegrationConnectionId)(ctx.integration);
        const webhookVerification = this.webhookVerification;
        const agentId = ctx.agentId;
        class ConversationWindowGuardedAdapter extends AdapterClass {
            handleVerificationChallenge(request) {
                const response = super.handleVerificationChallenge(request);
                if (response.status === 200)
                    void webhookVerification.markVerified(agentId);
                return response;
            }
            async postMessage(threadId, message) {
                await assertCustomerServiceWindowOpen(this.chat, sdk, threadId, logger);
                return await super.postMessage(threadId, message);
            }
            async graphApiRequest(path, body) {
                const recipient = (0, is_record_1.isRecord)(body) && typeof body.to === 'string' ? body.to : undefined;
                return await withWhatsAppRateLimitBackoff(async () => await super.graphApiRequest(path, body), logger, { guard: channelRateLimitGuard, connectionId, recipient });
            }
            extractTextContent(message) {
                if (message.type === 'contacts')
                    return formatSharedContacts(message);
                return super.extractTextContent(message);
            }
            buildAttachments(inbound) {
                const attachments = super.buildAttachments(inbound);
                return inbound.type === 'location'
                    ? attachments.filter((attachment) => attachment.fetchData !== undefined)
                    : attachments;
            }
        }
        return new ConversationWindowGuardedAdapter(config);
    }
    formatActionDecisionMessage({ approved, selectedLabel, user, }) {
        const responder = user.fullName || user.userName || user.userId;
        return approved === undefined
            ? `✅ ${selectedLabel || 'Action'} selected by ${responder}`
            : approved
                ? `✅ Approved by ${responder}`
                : `🚫 Declined by ${responder}`;
    }
    normalizeComponents(components, context) {
        const buttons = components.filter((c) => c.type === 'button');
        if (buttons.length <= WHATSAPP_MAX_REPLY_BUTTONS)
            return components;
        const existingSelect = components.find((c) => c.type === 'select' || c.type === 'radio_select');
        if (existingSelect) {
            const overflowOptions = buttons.map((b) => ({
                label: b.label ?? (0, component_mapper_1.componentTextToString)(b.text) ?? b.value ?? '',
                value: b.value ?? b.label ?? '',
            }));
            return components
                .filter((c) => c.type !== 'button')
                .map((c) => c === existingSelect ? { ...c, options: [...(c.options ?? []), ...overflowOptions] } : c);
        }
        const normalized = components.filter((c) => c.type !== 'button');
        normalized.push({
            type: 'select',
            id: `resume:${context.runId}:${context.toolCallId}:0`,
            label: 'Choose an option',
            options: buttons.map((b) => ({
                label: b.label ?? (0, component_mapper_1.componentTextToString)(b.text) ?? b.value ?? '',
                value: context.wrapResumeValue(b.value ?? b.label ?? ''),
            })),
        });
        return normalized;
    }
    createAdapterLogger() {
        const forward = (level) => (message, ..._args) => {
            this.logger[level](`[WhatsAppAdapter] ${message}`);
        };
        const logger = {
            child: () => logger,
            debug: forward('debug'),
            info: forward('info'),
            warn: forward('warn'),
            error: forward('error'),
        };
        return logger;
    }
    extractAccessToken(credential) {
        return this.requireCredentialField(credential, 'accessToken', 'The WhatsApp credential is missing an Access Token. Copy it from the WhatsApp > API Setup page of the Meta app.');
    }
    extractPhoneNumberId(credential) {
        return this.requireCredentialField(credential, 'phoneNumberId', 'The WhatsApp credential is missing a Phone Number ID. Copy it from the WhatsApp > API Setup page of the Meta app.');
    }
    extractBusinessAccountId(credential) {
        return this.requireCredentialField(credential, 'businessAccountId', 'The WhatsApp credential is missing a WhatsApp Business Account ID.');
    }
    extractAppSecret(credential) {
        return this.requireCredentialField(credential, 'appSecret', 'The WhatsApp credential is missing an App Secret. Copy it from App Settings > Basic in the Meta app.');
    }
    deriveVerifyToken(agentId) {
        return (0, integration_helpers_1.deriveWhatsAppVerifyToken)(this.instanceSettings.hmacSignatureSecret, agentId);
    }
    requireCredentialField(credential, field, message) {
        const value = credential[field];
        if (typeof value === 'string' && value.trim())
            return value.trim();
        throw new n8n_workflow_1.UserError(message);
    }
};
exports.WhatsAppIntegration = WhatsAppIntegration;
exports.WhatsAppIntegration = WhatsAppIntegration = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, n8n_core_1.InstanceSettings, channel_rate_limit_guard_1.ChannelRateLimitGuard, whatsapp_webhook_verification_store_1.WhatsAppWebhookVerificationStore])
], WhatsAppIntegration);
function whatsAppSettings(integration) {
    return (0, api_types_1.resolveWhatsAppSettings)(integration?.type === 'whatsapp' ? integration.settings : undefined);
}
function formatSharedContacts(message) {
    const contacts = (0, is_record_1.isRecord)(message) && Array.isArray(message.contacts) ? message.contacts : [];
    const lines = contacts.map((contact) => {
        const name = (0, is_record_1.isRecord)(contact) ? (0, integration_helpers_1.stringProperty)(contact.name, 'formatted_name') : undefined;
        const phones = (0, is_record_1.isRecord)(contact) && Array.isArray(contact.phones) ? contact.phones : [];
        const phoneNumbers = phones
            .map((phone) => (0, integration_helpers_1.stringProperty)(phone, 'phone'))
            .filter((phone) => phone !== undefined);
        const parts = name ? [name, ...phoneNumbers] : phoneNumbers;
        return parts.length > 0 ? `[Contact: ${parts.join(' - ')}]` : '[Contact]';
    });
    return lines.length > 0 ? lines.join('\n') : '[Contact]';
}
async function assertCustomerServiceWindowOpen(chat, sdk, threadId, logger) {
    const lastInboundAt = await lastInboundMessageAt(chat, sdk, threadId, logger);
    if (!lastInboundAt)
        return;
    if (Date.now() - lastInboundAt.getTime() > WHATSAPP_CUSTOMER_SERVICE_WINDOW_MS) {
        throw new n8n_workflow_1.UserError("WhatsApp only allows free-form replies within 24 hours of the customer's last message. " +
            'That window has closed for this conversation, so this message cannot be sent. ' +
            'Template messages for re-engaging customers outside the window are not supported.');
    }
}
const WHATSAPP_API_ERROR_MESSAGE = /^WhatsApp API error: (\d+) (.*)$/s;
function parseWhatsAppApiError(message) {
    const match = WHATSAPP_API_ERROR_MESSAGE.exec(message);
    if (!match)
        return undefined;
    const status = Number(match[1]);
    try {
        const body = JSON.parse(match[2]);
        const code = (0, is_record_1.isRecord)(body) && (0, is_record_1.isRecord)(body.error) && typeof body.error.code === 'number'
            ? body.error.code
            : undefined;
        return { status, code };
    }
    catch {
        return { status };
    }
}
function whatsAppRateLimitDetails(error) {
    if (!(error instanceof Error) || error.name !== 'AdapterError')
        return undefined;
    const details = parseWhatsAppApiError(error.message);
    if (!details)
        return undefined;
    const isRateLimit = details.status === 429 ||
        (details.code !== undefined && WHATSAPP_RATE_LIMIT_ERROR_CODES.has(details.code));
    return isRateLimit ? details : undefined;
}
function recipientRateLimitError(cause) {
    return Object.assign(new n8n_workflow_1.OperationalError('WhatsApp is rate-limiting messages to this recipient. Wait before sending them more messages.', { cause }), {
        response: { status: 429 },
        rateLimitScope: 'recipient',
    });
}
async function withWhatsAppRateLimitBackoff(send, logger, rateLimit) {
    const pairKey = rateLimit.recipient
        ? `${rateLimit.connectionId}:${rateLimit.recipient}`
        : undefined;
    if (rateLimit.guard.isBlocked(rateLimit.connectionId)) {
        throw Object.assign(new n8n_workflow_1.OperationalError((0, channel_rate_limit_1.channelRateLimitMessage)('whatsapp')), {
            response: { status: 429 },
        });
    }
    if (pairKey && rateLimit.guard.isBlocked(pairKey)) {
        throw recipientRateLimitError();
    }
    for (let attempt = 1;; attempt++) {
        try {
            return await send();
        }
        catch (error) {
            const details = whatsAppRateLimitDetails(error);
            if (!details)
                throw error;
            if (attempt >= WHATSAPP_RATE_LIMIT_MAX_ATTEMPTS) {
                if (details.code === WHATSAPP_PAIR_RATE_LIMIT_CODE && pairKey) {
                    rateLimit.guard.record(pairKey);
                    throw recipientRateLimitError(error);
                }
                rateLimit.guard.record(rateLimit.connectionId);
                throw Object.assign(new n8n_workflow_1.OperationalError('WhatsApp is rate-limiting messages to this number, likely because of its Meta ' +
                    'quality rating or daily messaging limit. Wait before sending more messages.', { cause: error }), { response: { status: 429 } });
            }
            const delayMs = Math.min(WHATSAPP_RATE_LIMIT_BACKOFF_BASE_MS * 2 ** (attempt - 1), WHATSAPP_RATE_LIMIT_BACKOFF_CAP_MS);
            logger.warn('[WhatsAppIntegration] Rate limited by WhatsApp, backing off before retrying', {
                attempt,
                delayMs,
            });
            await (0, sleep_1.sleep)(delayMs);
        }
    }
}
async function lastInboundMessageAt(chat, sdk, threadId, logger) {
    if (!chat)
        return undefined;
    try {
        const history = new sdk.ThreadHistoryCache(chat.getState());
        const messages = await history.getMessages(threadId);
        let lastInboundAt;
        for (const message of messages) {
            if (message.author.isMe)
                continue;
            lastInboundAt = message.metadata.dateSent;
        }
        return lastInboundAt;
    }
    catch (error) {
        logger.warn('[WhatsAppIntegration] Failed to read thread history for the 24h window check', {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
}
//# sourceMappingURL=whatsapp-integration.js.map