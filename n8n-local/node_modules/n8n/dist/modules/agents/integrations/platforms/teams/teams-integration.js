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
exports.TeamsIntegration = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const agent_repository_1 = require("../../../repositories/agent.repository");
const adapter_logger_1 = require("../../adapter-logger");
const credential_fields_1 = require("../../credential-fields");
const agent_chat_integration_1 = require("../../agent-chat-integration");
const component_mapper_1 = require("../../component-mapper");
const credential_claim_1 = require("../../credential-claim");
const esm_loader_1 = require("../../esm-loader");
const integration_tool_definitions_1 = require("../../integration-tool-definitions");
const integration_error_codes_1 = require("../../integration-error-codes");
const integration_helpers_1 = require("../../integration-helpers");
const typing_indicator_1 = require("../typing-indicator");
const teams_cleanup_service_1 = require("./teams-cleanup.service");
const teams_manifest_service_1 = require("./teams-manifest.service");
const teams_message_files_1 = require("./teams-message-files");
const teams_operations_1 = require("./teams-operations");
const TEAMS_API_URL = 'https://smba.trafficmanager.net/teams';
const GLOBAL_GRAPH_API_BASE_URL = 'https://graph.microsoft.com';
const ANSWER_AS_TEXT = 'To answer, write your answer as normal text. It is posted for you. Do not use the respond action for it.';
const OPTIONAL_REPLY_NOTE = [
    '<reply_guidance>',
    'This message does not mention you. You read it because you can read every message in this conversation.',
    'Answer only if the message is meant for you or you can add something useful within your role.',
    ANSWER_AS_TEXT,
    'Otherwise, call do_not_respond once. That ends your turn.',
    '</reply_guidance>',
].join('\n');
const JOINED_THREAD_REPLY_NOTE = [
    '<reply_guidance>',
    'This message does not mention you, but it is in a conversation you joined earlier.',
    'Answer if it continues your conversation or asks you something.',
    ANSWER_AS_TEXT,
    'If it is aimed at someone else, call do_not_respond once. That ends your turn.',
    '</reply_guidance>',
].join('\n');
function conversationTypeOf(activity) {
    return (0, is_record_1.isRecord)(activity) && (0, is_record_1.isRecord)(activity.conversation)
        ? activity.conversation.conversationType
        : undefined;
}
function isFromBot(activity) {
    if (!(0, is_record_1.isRecord)(activity) || !(0, is_record_1.isRecord)(activity.from))
        return false;
    const { id, role } = activity.from;
    return role === 'bot' || (typeof id === 'string' && id.startsWith('28:'));
}
const SEND_DENIED = {
    send_dm: 'Teams did not allow this direct message. The person must have the app installed in Teams first. Ask them, or a Teams admin, to add the app, then try again.',
    send_channel_message: 'Teams did not allow this post. The app must be added to the team or group chat first. Ask a team owner to add the app, then try again.',
};
function canEncodeThreadId(adapter) {
    return (0, is_record_1.isRecord)(adapter) && typeof adapter.encodeThreadId === 'function';
}
const TEAMS_TYPING_REFRESH_MS = 8000;
const TENANT_ID_GUID = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;
const TENANT_ID_DOMAIN = /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
let TeamsIntegration = class TeamsIntegration extends agent_chat_integration_1.AgentChatIntegration {
    async onRemove(ctx) {
        return await di_1.Container.get(teams_cleanup_service_1.TeamsCleanupService).describeLeftovers({
            user: ctx.user,
            projectId: ctx.projectId,
            credentialId: ctx.credentialId,
        });
    }
    shouldHandleUnmentionedMessage({ message, integration, }) {
        if (isFromBot(message.raw))
            return false;
        const settings = integration.type === 'teams' ? integration.settings : undefined;
        const type = conversationTypeOf(message.raw);
        const permission = teams_manifest_service_1.READ_PERMISSIONS.find((p) => p.conversationType === type);
        return (permission !== undefined &&
            settings?.[permission.requires] === true &&
            settings[permission.setting] === true);
    }
    getReplyExpectation({ message, isNewMention, }) {
        if (isNewMention || message.isMention === true)
            return 'required';
        return conversationTypeOf(message.raw) === 'personal' ? 'required' : 'optional';
    }
    normalizeChannelId(channelId, adapter) {
        if (!channelId.startsWith('19:') || !canEncodeThreadId(adapter)) {
            return super.normalizeChannelId(channelId, adapter);
        }
        return adapter.encodeThreadId({ conversationId: channelId, serviceUrl: `${TEAMS_API_URL}/` });
    }
    describeActionError(action, error) {
        const message = SEND_DENIED[action];
        if (!message || !(0, is_record_1.isRecord)(error) || error.code !== 'PERMISSION_DENIED')
            return undefined;
        return { code: integration_error_codes_1.INTEGRATION_ERROR_CODES.PERMISSION_NOT_GRANTED, message };
    }
    async executeContextQuery(params) {
        if (!params.chat)
            return (0, integration_helpers_1.connectionUnavailable)();
        return await (0, teams_operations_1.executeTeamsContextQuery)({
            chat: params.chat,
            query: params.query,
            input: params.input,
        });
    }
    async fetchInboundAttachments({ thread, message, }) {
        const http = (0, teams_message_files_1.graphHttpOf)(thread.adapter);
        return http ? await (0, teams_message_files_1.fetchTeamsMessageFiles)(http, message.raw) : [];
    }
    constructor(logger, agentRepository) {
        super();
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.type = 'teams';
        this.credentialTypes = ['microsoftEntraServicePrincipalApi'];
        this.displayLabel = 'Microsoft Teams';
        this.displayIcon = 'teams';
        this.internal = true;
        this.builderGuidance = {
            capabilities: [
                'Receive Microsoft Teams direct messages, team channel messages and group chat messages as agent triggers.',
                'Respond in the same Microsoft Teams conversation, and in the same channel thread.',
                'Send direct messages to people and post new messages to team channels and group chats, including from scheduled tasks with no inbound message.',
                'In a team channel or group chat, run when @-mentioned. When the setup turns on reading all messages there, run on every message and decide whether to reply, or stay silent.',
                'Add emoji reactions to messages.',
                'Render Adaptive Cards with buttons.',
            ],
            useIntegrationWhen: [
                'The agent should be chatted with from Microsoft Teams or act as a Teams bot.',
                'The agent needs to reply to Teams users in the same conversation context.',
                'The agent should take part in a Microsoft Teams channel or group chat.',
                'A scheduled Agent task should proactively send a Teams direct message or channel message through the connected bot.',
            ],
            useNodeToolWhen: [
                'Microsoft Teams is only a backend API step and the agent does not need to be connected as a Teams chat surface.',
                'The Teams operation is performed by a non-Agent workflow, or the exact operation is not listed in the Agent integration capabilities.',
            ],
        };
        this.supportedComponents = [
            'section',
            'button',
            'divider',
            'fields',
            'image',
        ];
        this.contextToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationContextQueryDefinitions)([
            'get_current_message_context',
            'get_current_subject',
            'get_current_user',
            'get_user',
            'search_users',
            'search_channels',
        ]);
        this.contextToolGuidance = [
            'For search_users, pass input.email to find a person by email address. The returned userId works with send_dm.',
            'search_channels matches team and channel names, for example "Marketing General". The returned channelId works with send_channel_message.',
        ];
        this.actionToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)([
            'respond',
            'send_dm',
            'send_channel_message',
            'edit_message',
            'add_reaction',
            'do_not_respond',
        ]);
        this.actionToolGuidance = [
            'respond works only in reply to an inbound Teams message. In a scheduled task, or to reach another person or conversation, use send_dm or send_channel_message.',
            'For send_dm, userId is a Teams user ID (29:...) or the Microsoft Entra object ID of the person, never an email or a name. To reach someone by email, call search_users first.',
            'For send_channel_message, channelId is a Teams conversation ID such as 19:...@thread.tacv2 for a team channel or 19:...@thread.v2 for a group chat, a channelId from search_channels, or one from get_current_message_context. Each call starts a new post.',
            'For edit_message, pass the messageId returned by a previous Teams action or get_current_message_context. The current Teams conversation is selected automatically.',
            'For add_reaction, use one of thumbs_up, eyes, check, x, rocket, thinking or pin, or a Teams reaction type such as like, heart or laugh.',
            'A channel or group chat message that does not mention you needs no reply. Use do_not_respond unless you have something useful to add.',
            'To acknowledge a message with only a reaction, call add_reaction and then do_not_respond. Any text you write after add_reaction is posted as a reply.',
        ];
        this.targetSuspensionCardAtActingUser = true;
        this.disableStreaming = false;
        this.singleStreamedRunPerTurn = true;
    }
    async createAdapter(ctx) {
        const { appId, appPassword, appTenantId } = this.extractBotCredentials(ctx.credential);
        const { createTeamsAdapter } = await (0, esm_loader_1.loadTeamsAdapter)();
        return createTeamsAdapter({
            appId,
            appPassword,
            appTenantId,
            apiUrl: TEAMS_API_URL,
            appType: 'SingleTenant',
            logger: (0, adapter_logger_1.createAdapterLogger)(this.logger, '[TeamsAdapter]'),
        });
    }
    async assertStartupPreconditions(ctx) {
        await (0, credential_claim_1.assertCredentialNotClaimed)(this.agentRepository, this.displayLabel, this.type, ctx);
    }
    async onBeforeConnect(ctx) {
        await this.assertStartupPreconditions(ctx);
        this.extractBotCredentials(ctx.credential);
    }
    normalizeComponents(components) {
        return (0, component_mapper_1.expandSelectsToButtons)(components);
    }
    async createBridgeExecutionContext(params) {
        const streamable = params.thread.isDM;
        return {
            platformAgentContext: {},
            ...(params.replyExpectation === 'optional'
                ? {
                    historyContext: params.inSubscribedThread
                        ? JOINED_THREAD_REPLY_NOTE
                        : OPTIONAL_REPLY_NOTE,
                }
                : {}),
            forceBuffered: !streamable,
            statusHandle: params.startStatus === false
                ? undefined
                : this.startTyping(params.thread, params.logger, params.agentId),
        };
    }
    async createResumeExecutionContext(params) {
        return {
            forceBuffered: true,
            statusHandle: this.startTyping(params.thread, params.logger, params.agentId),
        };
    }
    startTyping(thread, logger, agentId) {
        return (0, typing_indicator_1.startTypingIndicator)(thread, {
            logger,
            agentId,
            platform: 'Microsoft Teams',
            refreshMs: TEAMS_TYPING_REFRESH_MS,
        });
    }
    extractBotCredentials(credential) {
        if ((0, credential_fields_1.credentialField)(credential, 'authentication') === 'certificate') {
            throw new n8n_workflow_1.UserError('Microsoft Teams channels cannot use certificate authentication. ' +
                'Switch the credential to Client Secret, or create a credential that uses one.');
        }
        const graphApiBaseUrl = (0, credential_fields_1.credentialField)(credential, 'graphApiBaseUrl');
        if (graphApiBaseUrl && graphApiBaseUrl.replace(/\/+$/, '') !== GLOBAL_GRAPH_API_BASE_URL) {
            throw new n8n_workflow_1.UserError('Microsoft Teams channels only reach the global Microsoft cloud. ' +
                "Set the credential's Microsoft Graph API base URL back to https://graph.microsoft.com.");
        }
        const appTenantId = (0, credential_fields_1.requireCredentialField)(credential, 'tenantId', 'The Microsoft Teams credential is missing a Directory (tenant) ID. Copy it from the app registration overview in the Microsoft Entra admin center.');
        if (!TENANT_ID_GUID.test(appTenantId) && !TENANT_ID_DOMAIN.test(appTenantId)) {
            throw new n8n_workflow_1.UserError('The Microsoft Teams credential has an invalid Directory (tenant) ID. ' +
                'Use the GUID from the app registration overview, or a verified domain such as contoso.onmicrosoft.com.');
        }
        return {
            appId: (0, credential_fields_1.requireCredentialField)(credential, 'clientId', 'The Microsoft Teams credential is missing an Application (client) ID. Copy it from the app registration overview in the Microsoft Entra admin center.'),
            appPassword: (0, credential_fields_1.requireCredentialField)(credential, 'clientSecret', 'The Microsoft Teams credential is missing a Client Secret. Create one under Certificates & secrets on the app registration.'),
            appTenantId,
        };
    }
};
exports.TeamsIntegration = TeamsIntegration;
exports.TeamsIntegration = TeamsIntegration = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository])
], TeamsIntegration);
//# sourceMappingURL=teams-integration.js.map