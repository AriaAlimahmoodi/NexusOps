import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { ExecutionsConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { EvaluationCollectionRepository, EvaluationConfigRepository, TestCaseExecutionRepository, TestRun, TestRunRepository, WorkflowRepository } from '@n8n/db';
import { ErrorReporter, InstanceSettings } from 'n8n-core';
import type { IDataObject, IRun, IWorkflowBase } from 'n8n-workflow';
import { ActiveExecutions } from '../../active-executions';
import { ConcurrencyControlService } from '../../concurrency/concurrency-control.service';
import { License } from '../../license';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { OwnershipService } from '../../services/ownership.service';
import { Telemetry } from '../../telemetry';
import { WorkflowRunner } from '../../workflow-runner';
import { WorkflowHistoryService } from '../../workflows/workflow-history/workflow-history.service';
import { WorkflowCompilerService } from './workflow-compiler.service';
export interface TestRunMetadata {
    testRunId: string;
    userId: string;
}
export interface TestCaseExecutionResult {
    executionData: IRun;
    executionId: string;
}
export declare class TestRunnerService {
    private readonly logger;
    private readonly telemetry;
    private readonly workflowRepository;
    private readonly workflowRunner;
    private readonly activeExecutions;
    private readonly testRunRepository;
    private readonly testCaseExecutionRepository;
    private readonly errorReporter;
    private readonly executionsConfig;
    private readonly eventService;
    private readonly publisher;
    private readonly instanceSettings;
    private readonly concurrencyControlService;
    private readonly license;
    private readonly workflowHistoryService;
    private readonly evaluationCollectionRepository;
    private readonly evaluationConfigRepository;
    private readonly workflowCompiler;
    private readonly ownershipService;
    private abortControllers;
    constructor(logger: Logger, telemetry: Telemetry, workflowRepository: WorkflowRepository, workflowRunner: WorkflowRunner, activeExecutions: ActiveExecutions, testRunRepository: TestRunRepository, testCaseExecutionRepository: TestCaseExecutionRepository, errorReporter: ErrorReporter, executionsConfig: ExecutionsConfig, eventService: EventService, publisher: Publisher, instanceSettings: InstanceSettings, concurrencyControlService: ConcurrencyControlService, license: License, workflowHistoryService: WorkflowHistoryService, evaluationCollectionRepository: EvaluationCollectionRepository, evaluationConfigRepository: EvaluationConfigRepository, workflowCompiler: WorkflowCompilerService, ownershipService: OwnershipService);
    private findEvaluationTriggerNode;
    private validateEvaluationTriggerNode;
    private hasModelNodeConnected;
    private validateSetMetricsNodes;
    private validateSetOutputsNodes;
    private validateWorkflowConfiguration;
    private runTestCase;
    private runDatasetTrigger;
    static getEvaluationNodes(workflow: IWorkflowBase, operation: 'setMetrics' | 'setOutputs' | 'setInputs', { isDefaultOperation }?: {
        isDefaultOperation: boolean;
    }): import("n8n-workflow").INode[];
    static getEvaluationMetricsNodes(workflow: IWorkflowBase): import("n8n-workflow").INode[];
    static getEvaluationSetOutputsNodes(workflow: IWorkflowBase): import("n8n-workflow").INode[];
    private extractDatasetTriggerOutput;
    private getEvaluationData;
    private resolveCaseInputs;
    private datasetRowToJsonObject;
    private toJsonObject;
    private resolveCaseOutputs;
    private getEndNodeOutputs;
    private extractUserDefinedMetrics;
    private extractPredefinedMetrics;
    runTest(user: User, workflowId: string, concurrency?: number): Promise<void>;
    startTestRun(user: User, workflowId: string, concurrency?: number, options?: {
        collectionId?: string;
        workflowVersionId?: string;
        evaluationConfigId?: string;
        evaluationConfigSnapshot?: IDataObject;
        compileFromConfig?: boolean;
        via?: 'ui' | 'public-api';
        rowIndices?: number[];
    }): Promise<{
        testRun: TestRun;
        finished: Promise<void>;
    }>;
    private executeTestRun;
    canBeCancelled(testRun: TestRun): boolean;
    private cancelTestRunLocally;
    handleCancelTestRunCommand({ testRunId }: {
        testRunId: string;
    }): void;
    handleCancelCollectionCommand({ collectionId }: {
        collectionId: string;
    }): Promise<void>;
    private cancelCollectionLocally;
    cancelCollection(collectionId: string): Promise<{
        cancelledRunIds: string[];
    }>;
    cancelTestRun(testRunId: string): Promise<void>;
}
