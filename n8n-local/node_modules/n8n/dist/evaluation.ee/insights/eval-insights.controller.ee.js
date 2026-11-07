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
exports.EvalInsightsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const posthog_1 = require("../../posthog");
const eval_insights_service_1 = require("./eval-insights.service");
let EvalInsightsController = class EvalInsightsController {
    constructor(service, postHogClient, logger) {
        this.service = service;
        this.postHogClient = postHogClient;
        this.logger = logger;
    }
    async assertFlagEnabled(user) {
        let enabled = false;
        try {
            const flags = await this.postHogClient.getFeatureFlags(user);
            enabled = flags?.[api_types_1.EVAL_COLLECTIONS_FLAG] === true;
        }
        catch (error) {
            this.logger.warn('Failed to resolve eval-collections flag', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        if (!enabled)
            throw new errors_1.NotFoundError('Not found');
    }
    async generate(req, _res, payload) {
        await this.assertFlagEnabled(req.user);
        return await this.service.generateInsights(req.user, req.params.workflowId, req.params.collectionId, { forceRegenerate: payload?.forceRegenerate === true });
    }
};
exports.EvalInsightsController = EvalInsightsController;
__decorate([
    (0, decorators_1.Post)('/:workflowId/eval-collections/:collectionId/insights'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GenerateInsightsDto]),
    __metadata("design:returntype", Promise)
], EvalInsightsController.prototype, "generate", null);
exports.EvalInsightsController = EvalInsightsController = __decorate([
    (0, decorators_1.RestController)('/workflows'),
    __metadata("design:paramtypes", [eval_insights_service_1.EvalInsightsService, posthog_1.PostHogClient, backend_common_1.Logger])
], EvalInsightsController);
//# sourceMappingURL=eval-insights.controller.ee.js.map