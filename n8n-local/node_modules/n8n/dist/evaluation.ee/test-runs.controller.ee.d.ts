import { StartTestRunRequestDto } from '@n8n/api-types';
import { EvaluationConfigRepository, TestCaseExecutionRepository, TestRunRepository } from '@n8n/db';
import express from 'express';
import { TestRunnerService } from '../evaluation.ee/test-runner/test-runner.service.ee';
import { TestRunsRequest } from '../evaluation.ee/test-runs.types.ee';
import { Telemetry } from '../telemetry';
import { WorkflowFinderService } from '../workflows/workflow-finder.service';
export declare class TestRunsController {
    private readonly testRunRepository;
    private readonly workflowFinderService;
    private readonly testCaseExecutionRepository;
    private readonly testRunnerService;
    private readonly telemetry;
    private readonly evaluationConfigRepository;
    constructor(testRunRepository: TestRunRepository, workflowFinderService: WorkflowFinderService, testCaseExecutionRepository: TestCaseExecutionRepository, testRunnerService: TestRunnerService, telemetry: Telemetry, evaluationConfigRepository: EvaluationConfigRepository);
    private assertUserHasAccessToWorkflow;
    private getTestRun;
    private attachMetricScales;
    getMany(req: TestRunsRequest.GetMany): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import("@n8n/db/dist/entities/test-run.ee").TestRunStatus;
        runAt: Date | null;
        completedAt: Date | null;
        metrics: import("@n8n/db").AggregatedTestRunMetrics;
        errorCode: import("@n8n/db").TestRunErrorCode | null;
        errorDetails: import("n8n-workflow").IDataObject | null;
        workflow: import("@n8n/db").WorkflowEntity;
        workflowId: string;
        runningInstanceId: string | null;
        cancelRequested: boolean;
        workflowVersionId: string | null;
        evaluationConfigId: string | null;
        evaluationConfigSnapshot: import("n8n-workflow").IDataObject | null;
        collectionId: string | null;
        finalResult: import("@n8n/db").TestRunFinalResult | null;
        testCaseCount: number;
    }[]>;
    getOne(req: TestRunsRequest.GetOne): Promise<import("@n8n/db").TestRunSummary>;
    getTestCases(req: TestRunsRequest.GetCases): Promise<import("@n8n/db").TestCaseExecution[]>;
    delete(req: TestRunsRequest.Delete): Promise<{
        success: boolean;
    }>;
    cancel(req: TestRunsRequest.Cancel, res: express.Response): Promise<void>;
    cancelCase(req: TestRunsRequest.CancelCase): Promise<{
        success: boolean;
    }>;
    create(req: TestRunsRequest.Create, res: express.Response, payload: StartTestRunRequestDto): Promise<void>;
}
