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
exports.normalizeLinearIssue = exports.normalizeLinearComment = exports.ChatIntegrationContextQueryExecutor = void 0;
const di_1 = require("@n8n/di");
const agent_chat_integration_1 = require("./agent-chat-integration");
const chat_integration_service_1 = require("./chat-integration.service");
const integration_error_codes_1 = require("./integration-error-codes");
const integration_helpers_1 = require("./integration-helpers");
const channel_rate_limit_guard_1 = require("./channel-rate-limit.guard");
const channel_rate_limit_1 = require("./channel-rate-limit");
let ChatIntegrationContextQueryExecutor = class ChatIntegrationContextQueryExecutor {
    constructor(chatIntegrationService, integrationRegistry, channelRateLimitGuard) {
        this.chatIntegrationService = chatIntegrationService;
        this.integrationRegistry = integrationRegistry;
        this.channelRateLimitGuard = channelRateLimitGuard;
    }
    async execute(params) {
        if (!params.descriptor.agentId)
            return (0, integration_helpers_1.connectionUnavailable)();
        if (this.channelRateLimitGuard.isBlocked(params.descriptor.integrationConnectionId)) {
            return (0, integration_helpers_1.rateLimitExceeded)((0, channel_rate_limit_1.channelRateLimitMessage)(params.descriptor.integration.type));
        }
        const integrationDef = this.integrationRegistry.get(params.descriptor.integration.type);
        if (integrationDef && !integrationDef.requiresChatInstance) {
            if (!integrationDef.executeContextQuery) {
                return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.UNSUPPORTED_QUERY, `The ${params.descriptor.integration.type} integration does not support context queries.`);
            }
            try {
                return await integrationDef.executeContextQuery({
                    chat: undefined,
                    descriptor: params.descriptor,
                    query: params.query,
                    input: params.input,
                });
            }
            catch (error) {
                return (0, channel_rate_limit_1.caughtIntegrationError)(error, {
                    connectionId: params.descriptor.integrationConnectionId,
                    platform: params.descriptor.integration.type,
                    guard: this.channelRateLimitGuard,
                    failedCode: integration_error_codes_1.INTEGRATION_ERROR_CODES.CONTEXT_QUERY_FAILED,
                });
            }
        }
        const { credentialId } = params.descriptor.integration;
        if (!credentialId)
            return (0, integration_helpers_1.connectionUnavailable)();
        const chat = await this.chatIntegrationService.getChatInstanceForTools(params.descriptor.agentId, params.descriptor.integration);
        if (!chat)
            return (0, integration_helpers_1.connectionUnavailable)();
        if (!integrationDef?.executeContextQuery) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.UNSUPPORTED_QUERY, `The ${params.descriptor.integration.type} integration does not support context queries.`);
        }
        try {
            return await integrationDef.executeContextQuery({
                chat,
                descriptor: params.descriptor,
                query: params.query,
                input: params.input,
            });
        }
        catch (error) {
            return (0, channel_rate_limit_1.caughtIntegrationError)(error, {
                connectionId: params.descriptor.integrationConnectionId,
                platform: params.descriptor.integration.type,
                guard: this.channelRateLimitGuard,
                failedCode: integration_error_codes_1.INTEGRATION_ERROR_CODES.CONTEXT_QUERY_FAILED,
            });
        }
    }
};
exports.ChatIntegrationContextQueryExecutor = ChatIntegrationContextQueryExecutor;
exports.ChatIntegrationContextQueryExecutor = ChatIntegrationContextQueryExecutor = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [chat_integration_service_1.ChatIntegrationService, agent_chat_integration_1.ChatIntegrationRegistry, channel_rate_limit_guard_1.ChannelRateLimitGuard])
], ChatIntegrationContextQueryExecutor);
var linear_operations_1 = require("./platforms/linear-operations");
Object.defineProperty(exports, "normalizeLinearComment", { enumerable: true, get: function () { return linear_operations_1.normalizeLinearComment; } });
Object.defineProperty(exports, "normalizeLinearIssue", { enumerable: true, get: function () { return linear_operations_1.normalizeLinearIssue; } });
//# sourceMappingURL=integration-context-query-executor.js.map