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
exports.WorkflowStatisticsRollupService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const workflow_statistics_service_1 = require("./workflow-statistics.service");
const BATCH_SIZE = 5000;
const BATCH_DELAY_MS = 250;
const SKIP_WARN_THRESHOLD = 5;
let WorkflowStatisticsRollupService = class WorkflowStatisticsRollupService {
    constructor(logger, errorReporter, dbLockService, repository, statisticsService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.dbLockService = dbLockService;
        this.repository = repository;
        this.statisticsService = statisticsService;
        this.consecutiveLockSkips = 0;
        this.totalLockSkips = 0;
        this.logger = this.logger.scoped('workflow-statistics');
    }
    async rollup(signal, runBudgetMs = Number.POSITIVE_INFINITY) {
        const deadline = Date.now() + runBudgetMs;
        let batchStartedAt = Date.now();
        while (!signal.aborted &&
            (await this.rollupBatch()) >= BATCH_SIZE &&
            hasTimeForNextBatch(batchStartedAt, deadline)) {
            await this.waitBetweenBatches(signal);
            batchStartedAt = Date.now();
        }
    }
    async rollupBatch() {
        const result = await this.foldBatch();
        if (!result)
            return 0;
        await this.emitMilestones(result.firstOccurrences);
        return result.increments;
    }
    async waitBetweenBatches(signal) {
        try {
            await (0, sleep_1.sleep)(BATCH_DELAY_MS, signal);
        }
        catch {
        }
    }
    async foldBatch() {
        try {
            const result = await this.dbLockService.tryWithLock(1003, async (tx) => await this.repository.rollupIncrements(tx, BATCH_SIZE));
            this.consecutiveLockSkips = 0;
            return result;
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.OperationalError) {
                this.registerLockSkip();
                return null;
            }
            throw error;
        }
    }
    registerLockSkip() {
        this.consecutiveLockSkips++;
        this.totalLockSkips++;
        if (this.consecutiveLockSkips % SKIP_WARN_THRESHOLD !== 0)
            return;
        this.logger.warn('Workflow statistics rollup repeatedly skipped: lock held by another run or process', {
            consecutiveLockSkips: this.consecutiveLockSkips,
            totalLockSkips: this.totalLockSkips,
        });
    }
    async emitMilestones(firstOccurrences) {
        for (const occurrence of firstOccurrences) {
            try {
                await this.statisticsService.emitFirstOccurrenceEvent(occurrence.name, occurrence.workflowId, occurrence.workflowName, occurrence.firstEventMs);
            }
            catch (error) {
                this.errorReporter.error(error, { shouldBeLogged: true });
            }
        }
    }
};
exports.WorkflowStatisticsRollupService = WorkflowStatisticsRollupService;
exports.WorkflowStatisticsRollupService = WorkflowStatisticsRollupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, db_1.DbLockService, db_1.WorkflowStatisticsRepository, workflow_statistics_service_1.WorkflowStatisticsService])
], WorkflowStatisticsRollupService);
function hasTimeForNextBatch(lastBatchStartedAt, deadline) {
    const now = Date.now();
    return now + (now - lastBatchStartedAt) + BATCH_DELAY_MS < deadline;
}
//# sourceMappingURL=workflow-statistics-rollup.service.js.map