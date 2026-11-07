import { LicenseState } from '@n8n/backend-common';
import type { TestRun } from '@n8n/db';
import { TestCaseExecutionRepository, TestRunRepository, WorkflowRepository } from '@n8n/db';
type Pagination = {
    offset: number;
    limit: number;
};
export declare class EvaluationTestRunService {
    private readonly testRunRepository;
    private readonly testCaseExecutionRepository;
    private readonly workflowRepository;
    private readonly licenseState;
    constructor(testRunRepository: TestRunRepository, testCaseExecutionRepository: TestCaseExecutionRepository, workflowRepository: WorkflowRepository, licenseState: LicenseState);
    findManyAndCount(workflowId: string, pagination: Pagination, status?: TestRun['status']): Promise<{
        testRuns: {
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
        }[];
        count: number;
    }>;
    findSummaryByWorkflowId(runId: string, workflowId: string): Promise<import("@n8n/db").TestRunSummary | null>;
    findOneByIdAndWorkflowId(runId: string, workflowId: string): Promise<TestRun | null>;
    findTestCasesAndCount(runId: string, workflowId: string, pagination: Pagination): Promise<{
        testCases: import("@n8n/db").TestCaseExecution[];
        count: number;
    } | null>;
    assertEvaluationQuotaAvailable(workflowId: string): Promise<void>;
}
export {};
