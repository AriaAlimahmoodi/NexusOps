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
exports.EvaluationTestRunService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
let EvaluationTestRunService = class EvaluationTestRunService {
    constructor(testRunRepository, testCaseExecutionRepository, workflowRepository, licenseState) {
        this.testRunRepository = testRunRepository;
        this.testCaseExecutionRepository = testCaseExecutionRepository;
        this.workflowRepository = workflowRepository;
        this.licenseState = licenseState;
    }
    async findManyAndCount(workflowId, pagination, status) {
        const [testRuns, count] = await Promise.all([
            this.testRunRepository.getMany(workflowId, pagination, status),
            this.testRunRepository.countByWorkflowId(workflowId, status),
        ]);
        return { testRuns, count };
    }
    async findSummaryByWorkflowId(runId, workflowId) {
        return await this.testRunRepository.getTestRunSummaryByWorkflowId(runId, workflowId);
    }
    async findOneByIdAndWorkflowId(runId, workflowId) {
        return await this.testRunRepository.findOneByIdAndWorkflowId(runId, workflowId);
    }
    async findTestCasesAndCount(runId, workflowId, pagination) {
        if (!(await this.testRunRepository.existsInWorkflow(runId, workflowId))) {
            return null;
        }
        const [testCases, count] = await Promise.all([
            this.testCaseExecutionRepository.getManyByTestRunId(runId, pagination),
            this.testCaseExecutionRepository.countByTestRunId(runId),
        ]);
        return { testCases, count };
    }
    async assertEvaluationQuotaAvailable(workflowId) {
        const limit = this.licenseState.getMaxWorkflowsWithEvaluations();
        if (limit === constants_1.UNLIMITED_LICENSE_QUOTA)
            return;
        if ((await this.testRunRepository.countByWorkflowId(workflowId)) > 0)
            return;
        const used = await this.workflowRepository.getWorkflowsWithEvaluationCount();
        if (used >= limit) {
            throw new errors_1.PaymentRequiredError(`Evaluation quota exceeded: ${used}/${limit} workflows already have evaluations`);
        }
    }
};
exports.EvaluationTestRunService = EvaluationTestRunService;
exports.EvaluationTestRunService = EvaluationTestRunService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.TestRunRepository, db_1.TestCaseExecutionRepository, db_1.WorkflowRepository, backend_common_1.LicenseState])
], EvaluationTestRunService);
//# sourceMappingURL=evaluation-test-run.service.js.map