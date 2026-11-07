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
exports.EvaluationCollectionsController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const posthog_1 = require("../posthog");
const evaluation_collection_service_1 = require("./evaluation-collection.service");
let EvaluationCollectionsController = class EvaluationCollectionsController {
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
    async list(req) {
        await this.assertFlagEnabled(req.user);
        return await this.service.listCollections(req.params.workflowId);
    }
    async get(req) {
        await this.assertFlagEnabled(req.user);
        return await this.service.getCollectionDetail(req.params.workflowId, req.params.collectionId);
    }
    async create(req, _res, payload) {
        await this.assertFlagEnabled(req.user);
        const { record, runsStartedIds } = await this.service.createCollection(req.user, req.params.workflowId, payload);
        return { ...record, runsStartedIds };
    }
    async rerun(req) {
        await this.assertFlagEnabled(req.user);
        const { record, runsStartedIds } = await this.service.rerunCollection(req.user, req.params.workflowId, req.params.collectionId);
        return { ...record, runsStartedIds };
    }
    async update(req, _res, payload) {
        await this.assertFlagEnabled(req.user);
        return await this.service.updateCollectionMeta(req.params.workflowId, req.params.collectionId, payload);
    }
    async delete(req) {
        await this.assertFlagEnabled(req.user);
        const { runsUnlinked } = await this.service.deleteCollection(req.user, req.params.workflowId, req.params.collectionId);
        return { success: true, runsUnlinked };
    }
    async addRun(req, _res, payload) {
        await this.assertFlagEnabled(req.user);
        return await this.service.addRunToCollection(req.params.workflowId, req.params.collectionId, payload.testRunId);
    }
    async removeRun(req) {
        await this.assertFlagEnabled(req.user);
        return await this.service.removeRunFromCollection(req.params.workflowId, req.params.collectionId, req.params.runId);
    }
    async listVersions(req) {
        await this.assertFlagEnabled(req.user);
        const { evaluationConfigId } = req.query;
        if (!evaluationConfigId) {
            throw new errors_1.BadRequestError('Missing required query parameter: evaluationConfigId');
        }
        return await this.service.getEvalVersions(req.params.workflowId, evaluationConfigId);
    }
};
exports.EvaluationCollectionsController = EvaluationCollectionsController;
__decorate([
    (0, decorators_1.Get)('/:workflowId/eval-collections'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "list", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/eval-collections/:collectionId'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "get", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/eval-collections'),
    (0, decorators_1.ProjectScope)('workflow:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateEvaluationCollectionDto]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "create", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/eval-collections/:collectionId/rerun'),
    (0, decorators_1.ProjectScope)('workflow:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "rerun", null);
__decorate([
    (0, decorators_1.Patch)('/:workflowId/eval-collections/:collectionId'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateEvaluationCollectionDto]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "update", null);
__decorate([
    (0, decorators_1.Delete)('/:workflowId/eval-collections/:collectionId'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/eval-collections/:collectionId/runs'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AddRunToCollectionDto]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "addRun", null);
__decorate([
    (0, decorators_1.Delete)('/:workflowId/eval-collections/:collectionId/runs/:runId'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "removeRun", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/eval-versions'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationCollectionsController.prototype, "listVersions", null);
exports.EvaluationCollectionsController = EvaluationCollectionsController = __decorate([
    (0, decorators_1.RestController)('/workflows'),
    __metadata("design:paramtypes", [evaluation_collection_service_1.EvaluationCollectionService, posthog_1.PostHogClient, backend_common_1.Logger])
], EvaluationCollectionsController);
//# sourceMappingURL=evaluation-collections.controller.ee.js.map