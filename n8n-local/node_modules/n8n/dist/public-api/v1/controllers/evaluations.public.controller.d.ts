import { CancelledTestRunPublicDto, CreatedTestRunPublicDto, ListTestCasesQueryPublicDto, ListTestRunsQueryPublicDto, TestCaseExecutionListPublicDto, TestRunListPublicDto, TestRunSummaryPublicDto } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { ErrorReporter } from 'n8n-core';
import { EvaluationTestRunService } from '../../../evaluation.ee/evaluation-test-run.service';
import { TestRunnerService } from '../../../evaluation.ee/test-runner/test-runner.service.ee';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
export declare class EvaluationsPublicController {
    private readonly evaluationTestRunService;
    private readonly testRunnerService;
    private readonly workflowFinderService;
    private readonly licenseState;
    private readonly errorReporter;
    constructor(evaluationTestRunService: EvaluationTestRunService, testRunnerService: TestRunnerService, workflowFinderService: WorkflowFinderService, licenseState: LicenseState, errorReporter: ErrorReporter);
    getTestRuns(_req: AuthenticatedRequest, _res: Response, workflowId: string, query: ListTestRunsQueryPublicDto): Promise<TestRunListPublicDto>;
    createTestRun(req: AuthenticatedRequest, _res: Response, workflowId: string): Promise<CreatedTestRunPublicDto>;
    getTestRun(_req: AuthenticatedRequest, _res: Response, workflowId: string, runId: string): Promise<TestRunSummaryPublicDto>;
    getTestCases(_req: AuthenticatedRequest, _res: Response, workflowId: string, runId: string, query: ListTestCasesQueryPublicDto): Promise<TestCaseExecutionListPublicDto>;
    cancelTestRun(_req: AuthenticatedRequest, _res: Response, workflowId: string, runId: string): Promise<CancelledTestRunPublicDto>;
    private assertEvaluationsEnabled;
}
