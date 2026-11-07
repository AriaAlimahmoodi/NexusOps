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
exports.SlackIntegration = void 0;
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const agent_repository_1 = require("../../../repositories/agent.repository");
const agent_chat_integration_1 = require("../../agent-chat-integration");
const credential_claim_1 = require("../../credential-claim");
const esm_loader_1 = require("../../esm-loader");
const integration_helpers_1 = require("../../integration-helpers");
const integration_tool_definitions_1 = require("../../integration-tool-definitions");
const slack_bridge_behavior_1 = require("./slack-bridge-behavior");
const slack_managed_setup_service_1 = require("./slack-managed-setup.service");
const slack_operations_1 = require("./slack-operations");
let SlackIntegration = class SlackIntegration extends agent_chat_integration_1.AgentChatIntegration {
    constructor(agentRepository) {
        super();
        this.agentRepository = agentRepository;
        this.type = 'slack';
        this.credentialTypes = ['slackApi'];
        this.displayLabel = 'Slack';
        this.displayIcon = 'slack';
        this.builderGuidance = {
            capabilities: [
                'Receive Slack mentions and messages as agent triggers.',
                'Respond in the latest Slack thread, DM, or channel conversation context.',
                'Send DMs and channel messages, search users/channels, and add emoji reactions.',
                'Render rich cards and feedback requests in Slack messages.',
            ],
            useIntegrationWhen: [
                'The agent should be chatted with from Slack, invoked with @mentions, or keep conversing in Slack threads.',
                'The agent needs Slack message context, user/channel lookup, DMs, channel messages, emoji reactions, or rich UI in Slack.',
                'The agent should communicate as the connected Slack bot rather than merely call Slack as a backend API.',
                'A scheduled Agent task should proactively send a DM or channel message through the connected Slack bot.',
            ],
            useNodeToolWhen: [
                'Slack is only a backend API step in a broader task and the agent does not need Slack conversation context.',
                'The Slack operation is performed by a non-Agent workflow, or the exact operation is not listed in the Agent integration capabilities.',
            ],
        };
        this.supportedComponents = [
            'section',
            'button',
            'select',
            'radio_select',
            'divider',
            'image',
            'fields',
        ];
        this.contextToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationContextQueryDefinitions)([
            'get_current_message_context',
            'get_current_subject',
            'get_current_user',
            'get_current_channel_info',
            'get_user',
            'get_channel_info',
            'search_users',
            'search_channels',
        ]);
        this.actionToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)([
            'respond',
            'send_dm',
            'send_channel_message',
            'add_reaction',
            'do_not_respond',
        ]);
    }
    async assertStartupPreconditions(ctx) {
        await (0, credential_claim_1.assertCredentialNotClaimed)(this.agentRepository, this.displayLabel, this.type, ctx);
    }
    async onBeforeConnect(ctx) {
        await this.assertStartupPreconditions(ctx);
    }
    async onRemove(ctx) {
        return await di_1.Container.get(slack_managed_setup_service_1.SlackManagedSetupService).deleteAppForCredential(ctx);
    }
    async prepareSentThread(thread, integration) {
        if (this.usesAgentMessagingExperience(integration) && this.isConversationScopedDm(thread.id)) {
            return;
        }
        await (0, slack_operations_1.subscribeSlackThread)(thread);
    }
    messageThreadId(message, context) {
        if (context?.inbound && this.isConversationScopedInbound(message))
            return undefined;
        const match = /^slack:([CDG][^:]*):(.*)$/.exec(message.threadId);
        if (!match)
            return undefined;
        const [, channel, threadTs] = match;
        if (threadTs)
            return undefined;
        return `slack:${channel}:${message.id}`;
    }
    getPlatformAgentContext(chat) {
        return (0, slack_bridge_behavior_1.getSlackPlatformAgentContext)(chat);
    }
    prepareInboundText(text, context) {
        return (0, slack_bridge_behavior_1.prepareSlackInboundText)(text, context);
    }
    getReplyExpectation(params) {
        return (0, slack_bridge_behavior_1.getSlackReplyExpectation)(params);
    }
    async createBridgeExecutionContext(params) {
        return await (0, slack_bridge_behavior_1.createSlackBridgeExecutionContext)(params);
    }
    async createResumeExecutionContext(params) {
        return await (0, slack_bridge_behavior_1.createSlackResumeExecutionContext)(params);
    }
    async executeContextQuery(params) {
        if (!params.chat)
            return (0, integration_helpers_1.connectionUnavailable)();
        return await (0, slack_operations_1.executeSlackContextQuery)({
            chat: params.chat,
            query: params.query,
            input: params.input,
        });
    }
    async createAdapter(ctx) {
        const botToken = this.extractBotToken(ctx.credential);
        const signingSecret = this.extractSigningSecret(ctx.credential);
        const { createSlackAdapter } = await (0, esm_loader_1.loadSlackAdapter)();
        return createSlackAdapter({
            botToken,
            signingSecret,
            agentView: this.usesAgentMessagingExperience(ctx.integration),
        });
    }
    handleUnauthenticatedWebhook(context) {
        const { body } = context;
        if (!body || typeof body !== 'object')
            return undefined;
        const evt = body;
        if (evt.type === 'url_verification' && typeof evt.challenge === 'string') {
            return { status: 200, body: { challenge: evt.challenge } };
        }
        return undefined;
    }
    extractBotToken(credential) {
        const token = typeof credential.accessToken === 'string' && credential.accessToken
            ? credential.accessToken
            : undefined;
        if (!token) {
            throw new Error('Could not extract a bot token from the Slack credential. ' +
                'Please ensure the credential has a valid access token.');
        }
        if (!token.startsWith('xoxb-')) {
            const prefix = token.split('-')[0] ?? 'unknown';
            throw new Error(`The Slack credential contains a "${prefix}-" token, but agent integrations require a Bot User OAuth Token ("xoxb-"). ` +
                'You can find this in your Slack app under OAuth & Permissions → Bot User OAuth Token.');
        }
        return token;
    }
    extractSigningSecret(credential) {
        const secret = credential.signatureSecret;
        if (typeof secret === 'string' && secret) {
            return secret;
        }
        throw new Error('The Slack credential is missing a signing secret, which is required for agent integrations. ' +
            'Edit the credential and add your Slack app\'s "Signing Secret" (found under Basic Information in the Slack API dashboard).');
    }
    usesAgentMessagingExperience(integration) {
        return integration.type === 'slack' && integration.settings?.messagingExperience === 'agent';
    }
    isConversationScopedDm(threadId) {
        return /^slack:D[^:]+:$/.test(threadId);
    }
    isConversationScopedInbound(message) {
        if (this.isConversationScopedDm(message.threadId))
            return true;
        return (/^slack:G[^:]+:$/.test(message.threadId) &&
            (0, is_record_1.isRecord)(message.raw) &&
            message.raw.channel_type === 'mpim');
    }
};
exports.SlackIntegration = SlackIntegration;
exports.SlackIntegration = SlackIntegration = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository])
], SlackIntegration);
//# sourceMappingURL=slack-integration.js.map