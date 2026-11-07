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
exports.AgentEvalsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const collaboration_service_1 = require("../../collaboration/collaboration.service");
const agent_eval_rating_service_1 = require("./agent-eval-rating.service");
const agent_eval_service_1 = require("./agent-eval.service");
const agent_evals_flag_gate_1 = require("./agent-evals-flag-gate");
let AgentEvalsController = class AgentEvalsController {
    constructor(service, ratingService, flagGate, collaborationService) {
        this.service = service;
        this.ratingService = ratingService;
        this.flagGate = flagGate;
        this.collaborationService = collaborationService;
    }
    async listDatasets(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId } = req.params;
        return await this.service.listDatasets(agentId, projectId);
    }
    async createDraftDataset(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId } = req.params;
        return await this.service.createDraftDataset(req.user, agentId, projectId, payload.datasetName);
    }
    async createDataset(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId } = req.params;
        const parsed = api_types_1.createAgentEvalDatasetSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new errors_1.BadRequestError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        return await this.service.createDataset(req.user, agentId, projectId, parsed.data);
    }
    async getDataset(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, datasetId } = req.params;
        return await this.service.getDataset(agentId, projectId, datasetId);
    }
    async updateDataset(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, datasetId } = req.params;
        return await this.service.updateDataset(agentId, projectId, datasetId, payload);
    }
    async deleteDraftDataset(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, datasetId } = req.params;
        await this.service.deleteDraftDataset(req.user, agentId, projectId, datasetId);
        return { success: true };
    }
    async deleteDataset(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, datasetId } = req.params;
        await this.service.deleteDataset(agentId, projectId, datasetId);
        return { success: true };
    }
    async generateDraftCases(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId } = req.params;
        return await this.service.generateDraftCases(req.user, agentId, projectId, payload);
    }
    async previewRun(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId } = req.params;
        return await this.service.previewRun(req.user, agentId, projectId, payload);
    }
    async applyPreviewSuggestion(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId } = req.params;
        const pushRef = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, pushRef, projectId, agentId, 'update');
        return await this.service.applyPreviewSuggestion(req.user, agentId, projectId, payload, pushRef);
    }
    async startRun(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, datasetId } = req.params;
        return await this.service.startRun(req.user, agentId, projectId, datasetId, payload);
    }
    async listRuns(req, _res, query) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, datasetId } = req.params;
        return await this.service.listRuns(agentId, projectId, datasetId, query);
    }
    async getRun(req, _res, query) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, runId } = req.params;
        return await this.service.getRunDetail(req.user, agentId, projectId, runId, query);
    }
    async getRunSummary(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, runId } = req.params;
        return await this.service.getRunSummary(agentId, projectId, runId);
    }
    async cancelRun(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, runId } = req.params;
        return await this.service.cancelRun(agentId, projectId, runId);
    }
    async rerunResult(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, resultId } = req.params;
        return await this.service.rerunResult(req.user, agentId, projectId, resultId, payload);
    }
    async applySuggestions(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId } = req.params;
        const pushRef = req.headers?.['push-ref'];
        await this.collaborationService.validateAgentWriteLock(req.user.id, pushRef, projectId, agentId, 'update');
        return await this.service.applySuggestions(req.user, agentId, projectId, payload.resultIds, pushRef);
    }
    async acceptResult(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, resultId } = req.params;
        return await this.service.acceptResult(agentId, projectId, resultId);
    }
    async deleteResult(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, resultId } = req.params;
        await this.service.deleteResult(agentId, projectId, resultId);
        return { success: true };
    }
    async rateResult(req, _res, payload) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, resultId } = req.params;
        return await this.ratingService.rateResult(req.user, agentId, projectId, resultId, payload);
    }
    async listRatingsForResult(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, resultId } = req.params;
        return await this.ratingService.listRatingsForResult(agentId, projectId, resultId);
    }
    async listLatestRatingsForRun(req) {
        await this.flagGate.assertEnabled(req.user);
        const { agentId, projectId, runId } = req.params;
        return await this.ratingService.listLatestRatingsForRun(agentId, projectId, runId);
    }
};
exports.AgentEvalsController = AgentEvalsController;
__decorate([
    (0, decorators_1.Get)('/:agentId/evals/datasets'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "listDatasets", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/datasets/draft'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateDraftDatasetOptionsDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "createDraftDataset", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/datasets'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "createDataset", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/evals/datasets/:datasetId'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "getDataset", null);
__decorate([
    (0, decorators_1.Patch)('/:agentId/evals/datasets/:datasetId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateAgentEvalDatasetDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "updateDataset", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/evals/datasets/:datasetId/draft'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "deleteDraftDataset", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/evals/datasets/:datasetId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "deleteDataset", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/generate'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GenerateDraftCasesOptionsDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "generateDraftCases", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/preview-run'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PreviewRunOptionsDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "previewRun", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/preview-run/apply-suggestion'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ApplyPreviewSuggestionDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "applyPreviewSuggestion", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/datasets/:datasetId/runs'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateAgentEvalRunDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "startRun", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/evals/datasets/:datasetId/runs'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "listRuns", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/evals/runs/:runId'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AgentEvalRunDetailQueryDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "getRun", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/evals/runs/:runId/summary'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "getRunSummary", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/runs/:runId/cancel'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "cancelRun", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/results/:resultId/rerun'),
    (0, decorators_1.ProjectScope)('agent:execute'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.RerunResultOptionsDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "rerunResult", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/apply-suggestions'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ApplyAgentEvalSuggestionsDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "applySuggestions", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/results/:resultId/accept'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "acceptResult", null);
__decorate([
    (0, decorators_1.Delete)('/:agentId/evals/results/:resultId'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "deleteResult", null);
__decorate([
    (0, decorators_1.Post)('/:agentId/evals/results/:resultId/ratings'),
    (0, decorators_1.ProjectScope)('agent:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateAgentEvalRatingDto]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "rateResult", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/evals/results/:resultId/ratings'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "listRatingsForResult", null);
__decorate([
    (0, decorators_1.Get)('/:agentId/evals/runs/:runId/ratings'),
    (0, decorators_1.ProjectScope)('agent:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentEvalsController.prototype, "listLatestRatingsForRun", null);
exports.AgentEvalsController = AgentEvalsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/agents/v2'),
    __metadata("design:paramtypes", [agent_eval_service_1.AgentEvalService, agent_eval_rating_service_1.AgentEvalRatingService, agent_evals_flag_gate_1.AgentEvalsFlagGate, collaboration_service_1.CollaborationService])
], AgentEvalsController);
//# sourceMappingURL=agent-evals.controller.js.map