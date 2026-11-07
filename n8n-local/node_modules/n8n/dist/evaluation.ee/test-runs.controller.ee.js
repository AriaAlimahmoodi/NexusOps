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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunsController = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const express_1 = __importDefault(require("express"));
const n8n_workflow_1 = require("n8n-workflow");
const metric_scales_1 = require("./metric-scales");
const errors_1 = require("@n8n/errors");
const test_runner_service_ee_1 = require("../evaluation.ee/test-runner/test-runner.service.ee");
const middlewares_1 = require("../middlewares");
const telemetry_1 = require("../telemetry");
const workflow_finder_service_1 = require("../workflows/workflow-finder.service");
let TestRunsController = class TestRunsController {
    constructor(testRunRepository, workflowFinderService, testCaseExecutionRepository, testRunnerService, telemetry, evaluationConfigRepository) {
        this.testRunRepository = testRunRepository;
        this.workflowFinderService = workflowFinderService;
        this.testCaseExecutionRepository = testCaseExecutionRepository;
        this.testRunnerService = testRunnerService;
        this.telemetry = telemetry;
        this.evaluationConfigRepository = evaluationConfigRepository;
    }
    async assertUserHasAccessToWorkflow(workflowId, user, scopes = ['workflow:read']) {
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, scopes);
        if (!workflow) {
            throw new errors_1.NotFoundError('Workflow not found');
        }
    }
    async getTestRun(testRunId, workflowId, user, scopes = ['workflow:read']) {
        await this.assertUserHasAccessToWorkflow(workflowId, user, scopes);
        const testRun = await this.testRunRepository.findOne({
            where: { id: testRunId, workflow: { id: workflowId } },
        });
        if (!testRun)
            throw new errors_1.NotFoundError('Test run not found');
        return testRun;
    }
    async attachMetricScales(runs, workflowId) {
        const configIds = [
            ...new Set(runs
                .map((run) => run.evaluationConfigId)
                .filter((id) => typeof id === 'string')),
        ];
        const scalesByConfig = new Map();
        for (const configId of configIds) {
            scalesByConfig.set(configId, await (0, metric_scales_1.resolveConfigMetricScales)(this.evaluationConfigRepository, configId, workflowId));
        }
        return runs.map((run) => {
            const scales = (0, metric_scales_1.runMetricScales)(run, run.evaluationConfigId ? (scalesByConfig.get(run.evaluationConfigId) ?? {}) : {});
            return Object.keys(scales).length > 0 ? { ...run, metricScales: scales } : { ...run };
        });
    }
    async getMany(req) {
        const { workflowId } = req.params;
        await this.assertUserHasAccessToWorkflow(workflowId, req.user);
        const testRuns = await this.testRunRepository.getMany(workflowId, {
            offset: req.listQueryOptions?.skip,
            limit: req.listQueryOptions?.take,
        });
        return await this.attachMetricScales(testRuns, workflowId);
    }
    async getOne(req) {
        const { id, workflowId } = req.params;
        try {
            await this.getTestRun(id, workflowId, req.user);
            const summary = await this.testRunRepository.getTestRunSummaryById(id);
            const [withScales] = await this.attachMetricScales([summary], workflowId);
            return withScales;
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.UnexpectedError)
                throw new errors_1.NotFoundError(error.message);
            throw error;
        }
    }
    async getTestCases(req) {
        await this.getTestRun(req.params.id, req.params.workflowId, req.user);
        return await this.testCaseExecutionRepository.find({
            where: { testRun: { id: req.params.id } },
        });
    }
    async delete(req) {
        const { id: testRunId } = req.params;
        await this.getTestRun(req.params.id, req.params.workflowId, req.user, ['workflow:execute']);
        await this.testRunRepository.delete({ id: testRunId });
        this.telemetry.track('User deleted a run', { run_id: testRunId });
        return { success: true };
    }
    async cancel(req, res) {
        const { id: testRunId } = req.params;
        const testRun = await this.getTestRun(req.params.id, req.params.workflowId, req.user, [
            'workflow:execute',
        ]);
        if (this.testRunnerService.canBeCancelled(testRun)) {
            const message = `The test run "${testRunId}" cannot be cancelled`;
            throw new errors_1.ConflictError(message);
        }
        await this.testRunnerService.cancelTestRun(testRunId);
        res.status(202).json({ success: true });
    }
    async cancelCase(req) {
        const { caseId } = req.params;
        await this.getTestRun(req.params.id, req.params.workflowId, req.user, ['workflow:execute']);
        const cancelled = await this.testCaseExecutionRepository.cancelIfNew(req.params.id, caseId);
        if (!cancelled) {
            throw new errors_1.ConflictError(`Test case "${caseId}" cannot be cancelled — it is not in a pending state`);
        }
        this.telemetry.track('User cancelled a test case', {
            run_id: req.params.id,
            case_id: caseId,
        });
        return { success: true };
    }
    async create(req, res, payload) {
        const { workflowId } = req.params;
        await this.assertUserHasAccessToWorkflow(workflowId, req.user, ['workflow:execute']);
        const concurrency = payload.concurrency ?? 1;
        const options = {};
        if (payload.evaluationConfigId) {
            options.evaluationConfigId = payload.evaluationConfigId;
            options.compileFromConfig = payload.compileFromConfig === true;
        }
        if (payload.rowIndices && payload.rowIndices.length > 0) {
            options.rowIndices = payload.rowIndices;
        }
        const { testRun } = await this.testRunnerService.startTestRun(req.user, workflowId, concurrency, Object.keys(options).length > 0 ? options : undefined);
        res.status(202).json({ success: true, testRunId: testRun.id });
    }
};
exports.TestRunsController = TestRunsController;
__decorate([
    (0, decorators_1.Get)('/:workflowId/test-runs', { middlewares: middlewares_1.listQueryMiddleware }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunsController.prototype, "getMany", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/test-runs/:id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunsController.prototype, "getOne", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId/test-runs/:id/test-cases'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunsController.prototype, "getTestCases", null);
__decorate([
    (0, decorators_1.Delete)('/:workflowId/test-runs/:id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunsController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/test-runs/:id/cancel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TestRunsController.prototype, "cancel", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/test-runs/:id/test-cases/:caseId/cancel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunsController.prototype, "cancelCase", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/test-runs/new'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.StartTestRunRequestDto]),
    __metadata("design:returntype", Promise)
], TestRunsController.prototype, "create", null);
exports.TestRunsController = TestRunsController = __decorate([
    (0, decorators_1.RestController)('/workflows'),
    __metadata("design:paramtypes", [db_1.TestRunRepository, workflow_finder_service_1.WorkflowFinderService, db_1.TestCaseExecutionRepository, test_runner_service_ee_1.TestRunnerService, telemetry_1.Telemetry, db_1.EvaluationConfigRepository])
], TestRunsController);
//# sourceMappingURL=test-runs.controller.ee.js.map