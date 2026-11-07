import { Logger } from '@n8n/backend-common';
import { DbLockService, WorkflowStatisticsRepository } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
import { WorkflowStatisticsService } from './workflow-statistics.service';
export declare class WorkflowStatisticsRollupService {
    private readonly logger;
    private readonly errorReporter;
    private readonly dbLockService;
    private readonly repository;
    private readonly statisticsService;
    private consecutiveLockSkips;
    private totalLockSkips;
    constructor(logger: Logger, errorReporter: ErrorReporter, dbLockService: DbLockService, repository: WorkflowStatisticsRepository, statisticsService: WorkflowStatisticsService);
    rollup(signal: AbortSignal, runBudgetMs?: number): Promise<void>;
    private rollupBatch;
    private waitBetweenBatches;
    private foldBatch;
    private registerLockSkip;
    private emitMilestones;
}
