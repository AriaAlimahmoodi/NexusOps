import { type MetricScale } from '@n8n/api-types';
import { TestCaseExecutionRepository, WorkflowHistoryRepository } from '@n8n/db';
export type InsightsContextVersion = {
    testRunId: string;
    workflowVersionId: string | null;
    versionLabel: string;
    avgScore: number | null;
    scores: Record<string, number>;
    metricScales: Record<string, MetricScale>;
};
export type InsightsContextCase = {
    caseNumber: number;
    input: string;
    baseOutput: string;
    versionOutput: string;
    baseScorePercent: number | null;
    versionScorePercent: number | null;
};
export type InsightsPromptChange = {
    field: string;
    before: string;
    after: string;
};
export type InsightsModifiedNode = {
    node: string;
    promptChanges: InsightsPromptChange[];
};
export type InsightsContextWorkflowDiff = {
    added: string[];
    removed: string[];
    modified: InsightsModifiedNode[];
};
export type InsightsContextVersionView = {
    label: string;
    isBase: boolean;
    avgScorePercent: number | null;
    metricScores: Record<string, number>;
    workflowDiff: InsightsContextWorkflowDiff | null;
    regressedCases: InsightsContextCase[];
};
export type InsightsContext = {
    collectionName: string;
    baseVersionLabel: string;
    versions: InsightsContextVersionView[];
};
export declare class InsightsContextBuilder {
    private readonly workflowHistoryRepo;
    private readonly testCaseExecutionRepo;
    constructor(workflowHistoryRepo: WorkflowHistoryRepository, testCaseExecutionRepo: TestCaseExecutionRepository);
    build(workflowId: string, params: {
        collectionName: string;
        versions: InsightsContextVersion[];
        winnerLabel: string;
    }): Promise<InsightsContext>;
    private loadNodes;
    private loadCasesByRunIndex;
    private diff;
    private regressedCases;
}
