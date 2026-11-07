import type { CreateEvaluationCollectionPayload, EvalVersionsResponse, EvaluationCollectionDetail, EvaluationCollectionRecord, UpdateEvaluationCollectionPayload } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { DbLockService, EvaluationCollectionRepository, EvaluationConfigRepository, TestRunRepository, WorkflowHistoryRepository, WorkflowPublishedVersionRepository } from '@n8n/db';
import { TestRunnerService } from '../evaluation.ee/test-runner/test-runner.service.ee';
import { Telemetry } from '../telemetry';
import { WorkflowHistoryService } from '../workflows/workflow-history/workflow-history.service';
export declare class EvaluationCollectionService {
    private readonly collectionRepo;
    private readonly testRunRepo;
    private readonly evalConfigRepo;
    private readonly workflowHistoryRepo;
    private readonly publishedVersionRepo;
    private readonly workflowHistoryService;
    private readonly testRunnerService;
    private readonly telemetry;
    private readonly logger;
    private readonly dbLockService;
    constructor(collectionRepo: EvaluationCollectionRepository, testRunRepo: TestRunRepository, evalConfigRepo: EvaluationConfigRepository, workflowHistoryRepo: WorkflowHistoryRepository, publishedVersionRepo: WorkflowPublishedVersionRepository, workflowHistoryService: WorkflowHistoryService, testRunnerService: TestRunnerService, telemetry: Telemetry, logger: Logger, dbLockService: DbLockService);
    createCollection(user: User, workflowId: string, input: CreateEvaluationCollectionPayload): Promise<{
        record: EvaluationCollectionRecord;
        runsStartedIds: string[];
    }>;
    rerunCollection(user: User, workflowId: string, collectionId: string): Promise<{
        record: EvaluationCollectionRecord;
        runsStartedIds: string[];
    }>;
    private withRerunLock;
    listCollections(workflowId: string): Promise<EvaluationCollectionRecord[]>;
    getCollectionDetail(workflowId: string, collectionId: string): Promise<EvaluationCollectionDetail>;
    updateCollectionMeta(workflowId: string, collectionId: string, input: UpdateEvaluationCollectionPayload): Promise<EvaluationCollectionRecord>;
    deleteCollection(user: User, workflowId: string, collectionId: string): Promise<{
        runsUnlinked: number;
    }>;
    addRunToCollection(workflowId: string, collectionId: string, testRunId: string): Promise<EvaluationCollectionDetail>;
    removeRunFromCollection(workflowId: string, collectionId: string, testRunId: string): Promise<EvaluationCollectionDetail>;
    getEvalVersions(workflowId: string, evaluationConfigId: string): Promise<EvalVersionsResponse>;
    private freezeConfigSnapshot;
    private startCollectionRun;
    private toRecord;
    private toRunSummary;
    private computeAvgScore;
    private coerceMetrics;
    private extractDatasetId;
    private shortVersionLabel;
    private formatDateLabel;
    private formatSourceLabel;
}
