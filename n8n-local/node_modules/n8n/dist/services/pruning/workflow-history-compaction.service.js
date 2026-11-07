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
exports.WorkflowHistoryCompactionService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const luxon_1 = require("luxon");
const n8n_workflow_1 = require("n8n-workflow");
const workflow_history_compaction_utils_1 = require("./workflow-history-compaction.utils");
let WorkflowHistoryCompactionService = class WorkflowHistoryCompactionService {
    constructor(config, globalConfig, logger, workflowHistoryRepository, eventService) {
        this.config = config;
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.workflowHistoryRepository = workflowHistoryRepository;
        this.eventService = eventService;
        this.isOptimizingHistories = false;
        this.isTrimmingHistories = false;
        this.logger = this.logger.scoped('workflow-history-compaction');
    }
    async trimLongRunningHistories(signal) {
        if (this.isTrimmingHistories) {
            this.logger.debug('Skipping trimming as there is already a running iteration');
            return;
        }
        this.isTrimmingHistories = true;
        const { startDelta, endDelta } = (0, workflow_history_compaction_utils_1.getCompactionWindowDeltas)(this.config.trimmingMinimumAgeDays, this.config.trimmingTimeWindowDays, constants_1.Time.days.toMilliseconds);
        try {
            await this.compactHistories(this.startOfToday(), startDelta, endDelta, [
                n8n_workflow_1.RULES.makeMergeDependingOnSizeRule(new Map([
                    [0, 60 * 1_000],
                    [100, 10 * 60 * 1_000],
                    [1000, 2 * 60 * 60 * 1_000],
                    [5000, 5 * 60 * 60 * 1_000],
                    [10000, 10 * 60 * 60 * 1_000],
                ])),
            ], [], signal, { workflowSizeScore: true });
        }
        finally {
            this.isTrimmingHistories = false;
        }
    }
    async optimizeHistories(signal) {
        if (this.isOptimizingHistories) {
            this.logger.debug('Skipping recent optimization as there is already a running iteration');
            return;
        }
        this.isOptimizingHistories = true;
        const { startDelta, endDelta } = (0, workflow_history_compaction_utils_1.getCompactionWindowDeltas)(this.config.optimizingMinimumAgeHours, this.config.optimizingTimeWindowHours, constants_1.Time.hours.toMilliseconds);
        try {
            await this.compactHistories(new Date(), startDelta, endDelta, [n8n_workflow_1.RULES.mergeAdditiveChanges], [n8n_workflow_1.SKIP_RULES.makeSkipTimeDifference(20 * 60 * 1000)], signal);
        }
        finally {
            this.isOptimizingHistories = false;
        }
    }
    startOfToday() {
        return luxon_1.DateTime.now().setZone(this.globalConfig.generic.timezone).startOf('day').toJSDate();
    }
    async compactHistories(anchor, startDeltaMs, endDeltaMs, rules, skipRules, signal, metaData = {}) {
        const compactionStartTime = Date.now();
        const startDate = new Date(anchor.getTime() - startDeltaMs);
        const endDate = new Date(anchor.getTime() - endDeltaMs);
        const startIso = startDate.toISOString();
        const endIso = endDate.toISOString();
        this.logger.debug('Starting workflow history compaction', {
            dateRange: { start: startIso, end: endIso },
            config: this.config,
        });
        const workflowIds = await this.workflowHistoryRepository.getWorkflowIdsInRange(startDate, endDate);
        this.logger.debug(`Found ${workflowIds.length} workflows with versions between ${startIso} and ${endIso}`);
        let batchSum = 0;
        let workflowsProcessed = 0;
        let totalVersionsSeen = 0;
        let totalVersionsDeleted = 0;
        let errorCount = 0;
        for (const [index, workflowId] of workflowIds.entries()) {
            if (signal.aborted) {
                this.logger.debug(`Stopping workflow history compaction after ${index} of ${workflowIds.length} workflows, the pass was aborted`);
                break;
            }
            workflowsProcessed += 1;
            try {
                const { seen, deleted } = await this.workflowHistoryRepository.pruneHistory(workflowId, startDate, endDate, rules, skipRules, metaData);
                batchSum += seen;
                totalVersionsSeen += seen;
                totalVersionsDeleted += deleted;
                this.logger.debug(`Deleted ${deleted} of ${seen} versions of workflow ${workflowId} between ${startIso} and ${endIso}`);
            }
            catch (error) {
                errorCount += 1;
                this.logger.error(`Failed to prune version history of workflow ${workflowId}`, {
                    error: (0, ensure_error_1.ensureError)(error),
                });
                await this.waitBetweenBatches(signal);
            }
            if (batchSum > this.config.batchSize) {
                this.logger.debug(`Encountered more than ${this.config.batchSize} workflow versions, waiting ${this.config.batchDelayMs * constants_1.Time.milliseconds.toSeconds} second(s) before continuing.`);
                this.logger.debug(`Compacted ${index} of ${workflowIds.length} workflows with versions between ${startIso} and ${endIso}`);
                await this.waitBetweenBatches(signal);
                batchSum = 0;
            }
        }
        const durationMs = Date.now() - compactionStartTime;
        const payload = {
            workflowsProcessed,
            totalVersionsSeen,
            totalVersionsDeleted,
            errorCount,
            durationMs,
            compactionStartTime: new Date(compactionStartTime),
            windowStartIso: startIso,
            windowEndIso: endIso,
        };
        this.logger.debug('Workflow history compaction complete', payload);
        if (workflowIds.length > 0)
            this.eventService.emit('history-compacted', payload);
    }
    async waitBetweenBatches(signal) {
        try {
            await (0, sleep_1.sleep)(this.config.batchDelayMs, signal);
        }
        catch {
        }
    }
};
exports.WorkflowHistoryCompactionService = WorkflowHistoryCompactionService;
exports.WorkflowHistoryCompactionService = WorkflowHistoryCompactionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.WorkflowHistoryCompactionConfig, config_1.GlobalConfig, backend_common_1.Logger, db_1.WorkflowHistoryRepository, backend_services_1.EventService])
], WorkflowHistoryCompactionService);
//# sourceMappingURL=workflow-history-compaction.service.js.map