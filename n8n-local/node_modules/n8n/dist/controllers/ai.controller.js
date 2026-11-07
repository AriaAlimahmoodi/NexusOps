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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const ai_assistant_sdk_1 = require("@n8n_io/ai-assistant-sdk");
const node_assert_1 = require("node:assert");
const web_1 = require("node:stream/web");
const constants_1 = require("../constants");
const errors_1 = require("@n8n/errors");
const ai_gateway_service_1 = require("../services/ai-gateway.service");
const ai_usage_service_1 = require("../services/ai-usage.service");
const ai_workflow_builder_service_1 = require("../services/ai-workflow-builder.service");
const ai_service_1 = require("../services/ai.service");
const free_ai_credits_service_1 = require("../services/free-ai-credits.service");
let AiController = class AiController {
    constructor(aiService, workflowBuilderService, freeAiCreditsService, aiUsageService, aiGatewayService, globalConfig) {
        this.aiService = aiService;
        this.workflowBuilderService = workflowBuilderService;
        this.freeAiCreditsService = freeAiCreditsService;
        this.aiUsageService = aiUsageService;
        this.aiGatewayService = aiGatewayService;
        this.globalConfig = globalConfig;
    }
    toAiAssistantResponseError(error) {
        switch (error.statusCode) {
            case 413:
                return new errors_1.ContentTooLargeError(error.message);
            case 429:
                return new errors_1.TooManyRequestsError(error.message);
            case 404:
                return new errors_1.NotFoundError(error.message);
            case 400:
                return new errors_1.BadRequestError(error.message);
            default:
                return new errors_1.InternalServerError(error.message, error);
        }
    }
    toResponseError(error) {
        if (error instanceof ai_assistant_sdk_1.NetworkError) {
            return new errors_1.ServiceUnavailableError(error.message);
        }
        if (error instanceof ai_assistant_sdk_1.APIResponseError) {
            return this.toAiAssistantResponseError(error);
        }
        (0, node_assert_1.strict)(error instanceof Error);
        return new errors_1.InternalServerError(error.message, error);
    }
    async build(req, res, payload) {
        try {
            const abortController = new AbortController();
            const { signal } = abortController;
            const handleClose = () => abortController.abort();
            res.on('close', handleClose);
            const { id, text, workflowContext, featureFlags, versionId } = payload.payload;
            const aiResponse = this.workflowBuilderService.chat({
                id,
                message: text,
                workflowContext: {
                    currentWorkflow: workflowContext.currentWorkflow,
                    executionData: workflowContext.executionData,
                    executionSchema: workflowContext.executionSchema,
                    expressionValues: workflowContext.expressionValues,
                    valuesExcluded: workflowContext.valuesExcluded,
                    pinnedNodes: workflowContext.pinnedNodes,
                    selectedNodes: workflowContext.selectedNodes,
                },
                featureFlags,
                versionId,
                mode: payload.payload.mode,
                resumeData: payload.payload.resumeData,
            }, req.user, signal);
            res.header('Content-type', 'application/json-lines').flush();
            try {
                for await (const chunk of aiResponse) {
                    res.flush();
                    res.write(JSON.stringify(chunk) + constants_1.STREAM_SEPARATOR);
                }
            }
            catch (streamError) {
                (0, node_assert_1.strict)(streamError instanceof Error);
                const errorChunk = {
                    messages: [
                        {
                            role: 'assistant',
                            type: 'error',
                            content: streamError.message,
                        },
                    ],
                };
                res.write(JSON.stringify(errorChunk) + constants_1.STREAM_SEPARATOR);
            }
            finally {
                res.off('close', handleClose);
            }
            res.end();
        }
        catch (e) {
            (0, node_assert_1.strict)(e instanceof Error);
            if (!res.headersSent) {
                res.status(500).json({
                    code: 500,
                    message: e.message,
                });
            }
            else {
                res.end();
            }
        }
    }
    async chat(req, res, payload) {
        try {
            const abortController = new AbortController();
            const { signal } = abortController;
            const handleClose = () => abortController.abort();
            res.on('close', handleClose);
            const aiResponse = await this.aiService.chat(payload, req.user);
            if (aiResponse.body) {
                res.header('Content-type', 'application/json-lines').flush();
                try {
                    await aiResponse.body.pipeTo(new web_1.WritableStream({
                        write(chunk) {
                            res.write(chunk);
                            res.flush();
                        },
                    }), { signal });
                }
                finally {
                    res.off('close', handleClose);
                }
                res.end();
            }
        }
        catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') {
                return;
            }
            throw this.toResponseError(e);
        }
    }
    async applySuggestion(req, _, payload) {
        try {
            return await this.aiService.applySuggestion(payload, req.user);
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async askAi(req, _, payload) {
        try {
            return await this.aiService.askAi(payload, req.user);
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async aiCredits(req, _, payload) {
        try {
            return await this.freeAiCreditsService.claim(req.user, payload?.projectId);
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async getSessions(req, _, payload) {
        try {
            const sessions = await this.workflowBuilderService.getSessions(payload.workflowId, req.user, payload.codeBuilder);
            return sessions;
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async getGatewayConfig() {
        this.aiGatewayService.assertEnabled();
        try {
            return await this.aiGatewayService.getGatewayConfig();
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async getGatewayWallet(req) {
        this.aiGatewayService.assertEnabled();
        try {
            return await this.aiGatewayService.getWallet(req.user.id);
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async getGatewayUsage(req, _, query) {
        this.aiGatewayService.assertEnabled();
        try {
            return await this.aiGatewayService.getUsage(req.user.id, query.offset, query.limit);
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async getBuilderCredits(req, _) {
        try {
            return await this.workflowBuilderService.getBuilderInstanceCredits(req.user);
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async truncateMessages(req, _, payload) {
        try {
            const success = await this.workflowBuilderService.truncateMessagesAfter(payload.workflowId, req.user, payload.messageId, payload.versionCardId);
            return { success };
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async clearSession(req, _, payload) {
        try {
            await this.workflowBuilderService.clearSession(payload.workflowId, req.user);
            return { success: true };
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
    async updateUsageSettings(_req, _res, payload) {
        if (!payload.allowSendingParameterValues) {
            throw new errors_1.BadRequestError('Turning off sending parameter values is no longer supported.');
        }
        if (!this.globalConfig.ai.allowSendingParameterValues) {
            throw new errors_1.BadRequestError('Sending parameter values is turned off by the N8N_AI_ALLOW_SENDING_PARAMETER_VALUES environment variable. Remove it and restart n8n to turn this on.');
        }
        try {
            await this.aiUsageService.updateAiUsageSettings(payload.allowSendingParameterValues);
        }
        catch (e) {
            throw this.toResponseError(e);
        }
    }
};
exports.AiController = AiController;
__decorate([
    (0, decorators_1.Licensed)('feat:aiBuilder'),
    (0, decorators_1.Post)('/build', { ipRateLimit: { limit: 100 }, usesTemplates: true }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiBuilderChatRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "build", null);
__decorate([
    (0, decorators_1.Post)('/chat', { ipRateLimit: { limit: 100 } }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiChatRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chat", null);
__decorate([
    (0, decorators_1.Post)('/chat/apply-suggestion'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiApplySuggestionRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "applySuggestion", null);
__decorate([
    (0, decorators_1.Licensed)('feat:askAi'),
    (0, decorators_1.Post)('/ask-ai', { ipRateLimit: { limit: 100 } }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiAskRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "askAi", null);
__decorate([
    (0, decorators_1.Post)('/free-credits'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiFreeCreditsRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "aiCredits", null);
__decorate([
    (0, decorators_1.Licensed)('feat:aiBuilder'),
    (0, decorators_1.Post)('/sessions', { ipRateLimit: { limit: 100 } }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiSessionRetrievalRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getSessions", null);
__decorate([
    (0, decorators_1.Licensed)('feat:aiGateway'),
    (0, decorators_1.Get)('/gateway/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getGatewayConfig", null);
__decorate([
    (0, decorators_1.Licensed)('feat:aiGateway'),
    (0, decorators_1.Get)('/gateway/wallet'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getGatewayWallet", null);
__decorate([
    (0, decorators_1.Licensed)('feat:aiGateway'),
    (0, decorators_1.Get)('/gateway/usage'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiGatewayUsageQueryDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getGatewayUsage", null);
__decorate([
    (0, decorators_1.Licensed)('feat:aiBuilder'),
    (0, decorators_1.Get)('/build/credits'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getBuilderCredits", null);
__decorate([
    (0, decorators_1.Licensed)('feat:aiBuilder'),
    (0, decorators_1.Post)('/build/truncate-messages', { ipRateLimit: { limit: 100 } }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiTruncateMessagesRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "truncateMessages", null);
__decorate([
    (0, decorators_1.Licensed)('feat:aiBuilder'),
    (0, decorators_1.Post)('/build/clear-session', { ipRateLimit: { limit: 100 } }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiClearSessionRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "clearSession", null);
__decorate([
    (0, decorators_1.Post)('/usage-settings'),
    (0, decorators_1.GlobalScope)('aiAssistant:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiUsageSettingsRequestDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "updateUsageSettings", null);
exports.AiController = AiController = __decorate([
    (0, decorators_1.RestController)('/ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService, ai_workflow_builder_service_1.WorkflowBuilderService, free_ai_credits_service_1.FreeAiCreditsService, ai_usage_service_1.AiUsageService, ai_gateway_service_1.AiGatewayService, config_1.GlobalConfig])
], AiController);
//# sourceMappingURL=ai.controller.js.map