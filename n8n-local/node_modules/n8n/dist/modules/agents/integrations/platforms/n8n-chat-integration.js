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
exports.N8nChatIntegration = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_chat_integration_1 = require("../agent-chat-integration");
const integration_action_executor_1 = require("../integration-action-executor");
const integration_error_codes_1 = require("../integration-error-codes");
const integration_helpers_1 = require("../integration-helpers");
const integration_tool_definitions_1 = require("../integration-tool-definitions");
let N8nChatIntegration = class N8nChatIntegration extends agent_chat_integration_1.AgentChatIntegration {
    constructor(userRepository) {
        super();
        this.userRepository = userRepository;
        this.type = api_types_1.N8N_CHAT_INTEGRATION_TYPE;
        this.credentialTypes = [];
        this.displayLabel = 'n8n Chat';
        this.displayIcon = 'message-square';
        this.internal = true;
        this.requiresChatInstance = false;
        this.builderGuidance = {
            capabilities: [
                'Make the agent available to users of this n8n instance in n8n Chat.',
                'Respond in the n8n Chat conversation and render rich cards with buttons and selects.',
                'Needs no credential. The setup card saves the channel and the agent description that n8n Chat shows.',
                'Production n8n Chat reaches only a published agent: after setup, offer to publish if the agent is not published.',
            ],
            useIntegrationWhen: [
                'The user asks to make the agent available in n8n Chat, or to chat with it inside n8n.',
                'The agent should be usable by people on this n8n instance without an external chat platform.',
            ],
            useNodeToolWhen: ['Never. n8n Chat is a channel only and has no node tool.'],
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
        ]);
        this.actionToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)(['respond']);
        this.actionToolGuidance = [
            'This is the built-in n8n chat: your normal assistant reply already reaches the user. NEVER call respond with only message.text — write that text directly in your reply instead. Call this tool only with message.card, to render a rich card or collect structured input.',
        ];
    }
    async createAdapter() {
        throw new n8n_workflow_1.UnexpectedError('The n8n chat integration has no platform adapter.');
    }
    async executeAction(params) {
        if (params.action !== 'respond')
            return undefined;
        const parsed = integration_action_executor_1.respondInputSchema.safeParse(params.input);
        if (!parsed.success) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_FAILED, parsed.error.message);
        }
        if (!parsed.data.message.card) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_FAILED, 'Plain text is not delivered through this tool in the n8n chat — your normal assistant reply already reaches the user, so write the text directly in your reply. Call this tool only with message.card to render a rich card.');
        }
        if (!params.currentMessageContext) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT, 'There is no current message context.');
        }
        return {
            ok: true,
            messageContext: {
                ...params.currentMessageContext,
                messageId: undefined,
                updatedAt: new Date().toISOString(),
            },
        };
    }
    async executeContextQuery(params) {
        if (params.query === 'get_user') {
            const userId = typeof params.input.userId === 'string' ? params.input.userId : undefined;
            if (!userId) {
                return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.CONTEXT_QUERY_FAILED, 'userId is required.');
            }
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user) {
                return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.CONTEXT_QUERY_FAILED, `User ${userId} not found.`);
            }
            return {
                ok: true,
                user: {
                    id: user.id,
                    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
                    email: user.email,
                },
            };
        }
        return (0, integration_helpers_1.unsupportedQuery)(this.type, params.query);
    }
};
exports.N8nChatIntegration = N8nChatIntegration;
exports.N8nChatIntegration = N8nChatIntegration = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.UserRepository])
], N8nChatIntegration);
//# sourceMappingURL=n8n-chat-integration.js.map