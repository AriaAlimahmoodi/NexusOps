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
exports.EvaluationConfigController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const workflow_finder_service_1 = require("../workflows/workflow-finder.service");
const evaluation_config_service_1 = require("./evaluation-config.service");
const evaluation_dataset_service_1 = require("./evaluation-dataset.service");
let EvaluationConfigController = class EvaluationConfigController {
    constructor(service, datasetService, workflowFinderService) {
        this.service = service;
        this.datasetService = datasetService;
        this.workflowFinderService = workflowFinderService;
    }
    async assertWorkflowAccess(workflowId, user, scope) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            scope,
        ]);
        if (!workflow)
            throw new errors_1.NotFoundError('Workflow not found');
        return workflow;
    }
    async list(req) {
        await this.assertWorkflowAccess(req.params.workflowId, req.user, 'workflow:read');
        return await this.service.list(req.params.workflowId);
    }
    async get(req) {
        await this.assertWorkflowAccess(req.params.workflowId, req.user, 'workflow:read');
        const config = await this.service.get(req.params.workflowId, req.params.configId);
        if (!config)
            throw new errors_1.NotFoundError('Evaluation config not found');
        return config;
    }
    async create(req) {
        const workflow = await this.assertWorkflowAccess(req.params.workflowId, req.user, 'workflow:update');
        const dto = api_types_1.upsertEvaluationConfigSchema.parse(req.body);
        return await this.service.create(req.params.workflowId, workflow, req.user, dto);
    }
    async update(req) {
        const workflow = await this.assertWorkflowAccess(req.params.workflowId, req.user, 'workflow:update');
        const dto = api_types_1.upsertEvaluationConfigSchema.parse(req.body);
        return await this.service.update(req.params.workflowId, req.params.configId, workflow, req.user, dto);
    }
    async delete(req) {
        await this.assertWorkflowAccess(req.params.workflowId, req.user, 'workflow:update');
        await this.service.delete(req.params.workflowId, req.params.configId);
        return { success: true };
    }
    async datasetCandidate(req) {
        await this.assertWorkflowAccess(req.params.workflowId, req.user, 'workflow:read');
        const { executionId } = req.query;
        if (!executionId) {
            throw new errors_1.BadRequestError('executionId query parameter is required');
        }
        return await this.datasetService.getCandidate(req.user, req.params.workflowId, req.params.configId, executionId);
    }
    async addDatasetRow(req) {
        await this.assertWorkflowAccess(req.params.workflowId, req.user, 'workflow:update');
        const dto = api_types_1.addDatasetRowSchema.parse(req.body);
        return await this.datasetService.addRow(req.user, req.params.workflowId, req.params.configId, dto);
    }
};
exports.EvaluationConfigController = EvaluationConfigController;
__decorate([
    (0, decorators_1.Get)('/:workflowId/evaluation-configs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationConfigController.prototype, "list", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/evaluation-configs/:configId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationConfigController.prototype, "get", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/evaluation-configs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationConfigController.prototype, "create", null);
__decorate([
    (0, decorators_1.Put)('/:workflowId/evaluation-configs/:configId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationConfigController.prototype, "update", null);
__decorate([
    (0, decorators_1.Delete)('/:workflowId/evaluation-configs/:configId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationConfigController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/evaluation-configs/:configId/dataset-candidate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationConfigController.prototype, "datasetCandidate", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/evaluation-configs/:configId/dataset-rows'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationConfigController.prototype, "addDatasetRow", null);
exports.EvaluationConfigController = EvaluationConfigController = __decorate([
    (0, decorators_1.RestController)('/workflows'),
    __metadata("design:paramtypes", [evaluation_config_service_1.EvaluationConfigService, evaluation_dataset_service_1.EvaluationDatasetService, workflow_finder_service_1.WorkflowFinderService])
], EvaluationConfigController);
//# sourceMappingURL=evaluation-config.controller.js.map