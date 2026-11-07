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
exports.LinearIntegration = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const agent_chat_integration_1 = require("../agent-chat-integration");
const esm_loader_1 = require("../esm-loader");
const integration_tool_definitions_1 = require("../integration-tool-definitions");
const integration_helpers_1 = require("../integration-helpers");
const linear_operations_1 = require("./linear-operations");
const linear_tool_definitions_1 = require("./linear-tool-definitions");
let LinearIntegration = class LinearIntegration extends agent_chat_integration_1.AgentChatIntegration {
    constructor(logger, outboundHttp) {
        super();
        this.logger = logger;
        this.outboundHttp = outboundHttp;
        this.type = 'linear';
        this.credentialTypes = ['linearOAuth2Api'];
        this.displayLabel = 'Linear';
        this.displayIcon = 'linear';
        this.builderGuidance = {
            capabilities: [
                'Receive Linear issue/comment events and preserve the current Linear issue/comment context.',
                'Respond in the current Linear conversation when the agent was triggered from Linear.',
                'Read Linear users, teams, projects, labels, issue states, and issues through integration context tools.',
                'Create/update Linear issues and create comments when acting in the connected Linear context.',
            ],
            useIntegrationWhen: [
                'The agent should be chatted with from Linear issues/comments or participate in Linear agent sessions.',
                'The agent needs the current Linear issue/comment subject or should reply into the same Linear conversation.',
                'The user describes Linear as the place where humans will talk to or trigger the agent.',
            ],
            useNodeToolWhen: [
                'The agent only needs to search, create, or update Linear tickets as a capability while being triggered from Slack, schedule, Preview, or another source.',
                'The request is ticket management, triage, or customer-feedback filing in Linear without requiring a Linear chat/comment trigger.',
                'The user needs explicit configurable Linear node operations or approval gates for issue creation/update rather than conversation-aware Linear replies.',
            ],
        };
        this.contextToolDefinitions = [
            ...(0, integration_tool_definitions_1.resolveIntegrationContextQueryDefinitions)([
                'get_current_message_context',
                'get_current_subject',
                'get_current_user',
                'get_user',
                'search_users',
            ]),
            ...linear_tool_definitions_1.LINEAR_CONTEXT_QUERY_TOOL_DEFINITIONS,
        ];
        this.actionToolDefinitions = [
            ...(0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)(['respond']),
            ...linear_tool_definitions_1.LINEAR_ACTION_TOOL_DEFINITIONS,
        ];
    }
    async executeContextQuery(params) {
        if (!params.chat)
            return (0, integration_helpers_1.connectionUnavailable)();
        return await (0, linear_operations_1.executeLinearContextQuery)({
            chat: params.chat,
            query: params.query,
            input: params.input,
        });
    }
    async executeAction(params) {
        if (!params.chat)
            return (0, integration_helpers_1.connectionUnavailable)();
        return await (0, linear_operations_1.executeLinearAction)({
            chat: params.chat,
            descriptor: params.descriptor,
            action: params.action,
            input: params.input,
        });
    }
    async createAdapter(ctx) {
        const accessToken = this.extractAccessToken(ctx.credential);
        const webhookSecret = this.extractSigningSecret(ctx.credential);
        const userName = await this.fetchDisplayName(accessToken);
        const mode = this.extractMode(ctx.credential);
        const { createLinearAdapter } = await (0, esm_loader_1.loadLinearAdapter)();
        return createLinearAdapter({
            accessToken,
            webhookSecret,
            ...(userName ? { userName } : {}),
            ...(mode ? { mode } : {}),
        });
    }
    extractAccessToken(credential) {
        const tokenData = credential.oauthTokenData;
        const oauthToken = tokenData?.access_token ?? tokenData?.accessToken;
        if (typeof oauthToken === 'string' && oauthToken) {
            return oauthToken;
        }
        throw new Error('Could not extract an OAuth access token from the Linear credential. ' +
            'Please ensure the credential has completed the OAuth flow (linearOAuth2Api).');
    }
    extractSigningSecret(credential) {
        const secret = credential.signingSecret;
        if (typeof secret === 'string' && secret) {
            return secret;
        }
        throw new Error('The Linear credential is missing a signing secret, which is required for ' +
            'agent integrations. Edit the credential and add the signing secret from ' +
            'your Linear webhook configuration (Settings → API → Webhooks → Signing secret).');
    }
    extractMode(credential) {
        return credential.actor === 'app' ? 'agent-sessions' : undefined;
    }
    async fetchDisplayName(accessToken) {
        try {
            const response = await this.outboundHttp
                .requests({
                useDefaultSsrfPolicy: 'unsafe',
            })
                .request({
                method: 'POST',
                url: 'https://api.linear.app/graphql',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: { query: '{ viewer { displayName } }' },
                json: true,
                returnFullResponse: true,
                ignoreHttpStatusErrors: true,
            });
            if (response.statusCode < 200 || response.statusCode >= 300)
                return undefined;
            const json = response.body;
            return json.data?.viewer?.displayName;
        }
        catch (error) {
            this.logger.debug(`[LinearIntegration] viewer lookup failed: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }
};
exports.LinearIntegration = LinearIntegration;
exports.LinearIntegration = LinearIntegration = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_network_1.OutboundHttp])
], LinearIntegration);
//# sourceMappingURL=linear-integration.js.map