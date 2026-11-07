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
exports.EvaluationsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const evaluation_test_run_service_1 = require("../../../evaluation.ee/evaluation-test-run.service");
const test_runner_service_ee_1 = require("../../../evaluation.ee/test-runner/test-runner.service.ee");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const tags = ['Evaluation'];
const toTestRunSummaryPublicDto = (run) => ({
    id: run.id,
    status: run.status,
    runAt: run.runAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
    metrics: run.metrics ?? null,
    errorCode: run.errorCode ?? null,
    errorDetails: run.errorDetails ?? null,
    finalResult: run.finalResult ?? null,
    testCaseCount: run.testCaseCount,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
});
const toTestCaseExecutionPublicDto = (testCase) => {
    const executionId = testCase.executionId ?? null;
    return {
        id: testCase.id,
        status: testCase.status,
        runAt: testCase.runAt?.toISOString() ?? null,
        completedAt: testCase.completedAt?.toISOString() ?? null,
        metrics: testCase.metrics ?? null,
        errorCode: testCase.errorCode ?? null,
        errorDetails: testCase.errorDetails ?? null,
        inputs: testCase.inputs ?? null,
        outputs: testCase.outputs ?? null,
        executionId: executionId === null ? null : Number(executionId),
    };
};
let EvaluationsPublicController = class EvaluationsPublicController {
    constructor(evaluationTestRunService, testRunnerService, workflowFinderService, licenseState, errorReporter) {
        this.evaluationTestRunService = evaluationTestRunService;
        this.testRunnerService = testRunnerService;
        this.workflowFinderService = workflowFinderService;
        this.licenseState = licenseState;
        this.errorReporter = errorReporter;
    }
    async getTestRuns(_req, _res, workflowId, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const { testRuns, count } = await this.evaluationTestRunService.findManyAndCount(workflowId, { offset, limit }, query.status);
        return {
            data: testRuns.map(toTestRunSummaryPublicDto),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async createTestRun(req, _res, workflowId) {
        this.assertEvaluationsEnabled();
        const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, req.user, [
            'workflow:execute',
        ]);
        if (!workflow)
            throw new errors_1.NotFoundError('Workflow not found');
        const hasTrigger = workflow.nodes.some((node) => node.type === n8n_workflow_1.EVALUATION_TRIGGER_NODE_TYPE);
        if (!hasTrigger) {
            throw new errors_1.ConflictError('Workflow has no evaluation trigger');
        }
        await this.evaluationTestRunService.assertEvaluationQuotaAvailable(workflowId);
        const { testRun, finished } = await this.testRunnerService.startTestRun(req.user, workflowId, 1, { via: 'public-api' });
        void finished.catch((error) => this.errorReporter.error(error));
        return {
            id: testRun.id,
            status: testRun.status,
            createdAt: testRun.createdAt.toISOString(),
        };
    }
    async getTestRun(_req, _res, workflowId, runId) {
        const summary = await this.evaluationTestRunService.findSummaryByWorkflowId(runId, workflowId);
        if (!summary)
            throw new errors_1.NotFoundError('Test run not found');
        return toTestRunSummaryPublicDto({
            ...summary,
            testCaseCount: summary.testCaseExecutions?.length ?? 0,
        });
    }
    async getTestCases(_req, _res, workflowId, runId, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const result = await this.evaluationTestRunService.findTestCasesAndCount(runId, workflowId, {
            offset,
            limit,
        });
        if (!result)
            throw new errors_1.NotFoundError('Test run not found');
        return {
            data: result.testCases.map(toTestCaseExecutionPublicDto),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: result.count }),
        };
    }
    async cancelTestRun(_req, _res, workflowId, runId) {
        this.assertEvaluationsEnabled();
        const testRun = await this.evaluationTestRunService.findOneByIdAndWorkflowId(runId, workflowId);
        if (!testRun)
            throw new errors_1.NotFoundError('Test run not found');
        if (this.testRunnerService.canBeCancelled(testRun)) {
            throw new errors_1.ConflictError(`The test run "${runId}" cannot be cancelled`);
        }
        await this.testRunnerService.cancelTestRun(runId);
        return { id: runId, status: 'cancelled' };
    }
    assertEvaluationsEnabled() {
        if (this.licenseState.getMaxWorkflowsWithEvaluations() === 0) {
            throw new errors_1.ForbiddenError('Evaluations are not available on your plan');
        }
    }
};
exports.EvaluationsPublicController = EvaluationsPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('testRun:list'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Retrieve test runs'),
    (0, decorators_1.ApiDescription)('Retrieve the evaluation test runs of a workflow.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.TestRunListPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListTestRunsQueryPublicDto]),
    __metadata("design:returntype", Promise)
], EvaluationsPublicController.prototype, "getTestRuns", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('testRun:create'),
    (0, decorators_1.ProjectScope)('workflow:execute'),
    (0, decorators_1.ApiSummary)('Trigger a test run'),
    (0, decorators_1.ApiDescription)('Start a new evaluation test run for a workflow. The workflow must contain a configured ' +
        'evaluation trigger. Requires the `workflow:execute` project scope in addition to the ' +
        '`testRun:create` API key scope.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.CreatedTestRunPublicDto),
    (0, decorators_1.ApiErrorResponse)(402),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], EvaluationsPublicController.prototype, "createTestRun", null);
__decorate([
    (0, decorators_1.Get)('/:runId'),
    (0, decorators_1.ApiKeyScope)('testRun:read'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Retrieve a test run'),
    (0, decorators_1.ApiDescription)('Retrieve a single evaluation test run of a workflow, including its aggregated metrics and ' +
        'final result.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.TestRunSummaryPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, (0, decorators_1.Param)('runId', api_types_1.testRunIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], EvaluationsPublicController.prototype, "getTestRun", null);
__decorate([
    (0, decorators_1.Get)('/:runId/test-cases'),
    (0, decorators_1.ApiKeyScope)('testRun:read'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    (0, decorators_1.ApiSummary)('Retrieve test run cases'),
    (0, decorators_1.ApiDescription)('Retrieve the per-case results of an evaluation test run.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.TestCaseExecutionListPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, (0, decorators_1.Param)('runId', api_types_1.testRunIdParamSchema)),
    __param(4, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.ListTestCasesQueryPublicDto]),
    __metadata("design:returntype", Promise)
], EvaluationsPublicController.prototype, "getTestCases", null);
__decorate([
    (0, decorators_1.Post)('/:runId/cancel'),
    (0, decorators_1.ApiKeyScope)('testRun:cancel'),
    (0, decorators_1.ProjectScope)('workflow:execute'),
    (0, decorators_1.ApiSummary)('Cancel a test run'),
    (0, decorators_1.ApiDescription)('Cancel a running evaluation test run of a workflow. Requires the `workflow:execute` project ' +
        'scope in addition to the `testRun:cancel` API key scope.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(202, api_types_1.CancelledTestRunPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('workflowId', api_types_1.workflowIdParamSchema)),
    __param(3, (0, decorators_1.Param)('runId', api_types_1.testRunIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], EvaluationsPublicController.prototype, "cancelTestRun", null);
exports.EvaluationsPublicController = EvaluationsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/workflows/:workflowId/test-runs'),
    __metadata("design:paramtypes", [evaluation_test_run_service_1.EvaluationTestRunService, test_runner_service_ee_1.TestRunnerService, workflow_finder_service_1.WorkflowFinderService, backend_common_1.LicenseState, n8n_core_1.ErrorReporter])
], EvaluationsPublicController);
//# sourceMappingURL=evaluations.public.controller.js.map