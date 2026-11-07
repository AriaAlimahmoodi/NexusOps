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
exports.WorkflowStatisticsRollupTask = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const workflow_statistics_rollup_service_1 = require("./workflow-statistics-rollup.service");
const ROLLUP_INTERVAL_SECONDS = 5;
let WorkflowStatisticsRollupTask = class WorkflowStatisticsRollupTask {
    constructor(rollupService, schedulerConfig) {
        this.rollupService = rollupService;
        this.name = 'workflow-statistics-rollup';
        this.schedule = (0, decorators_1.intervalFromSeconds)(ROLLUP_INTERVAL_SECONDS);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: { retryOnFailure: true },
            leaderTimer: {
                runOnTakeover: true,
            },
        });
        this.runBudgetMs =
            (Math.min(ROLLUP_INTERVAL_SECONDS, schedulerConfig.leaseDurationSeconds) - 1) *
                constants_1.Time.seconds.toMilliseconds;
    }
    async run(signal) {
        await this.rollupService.rollup(signal, this.runBudgetMs);
    }
};
exports.WorkflowStatisticsRollupTask = WorkflowStatisticsRollupTask;
exports.WorkflowStatisticsRollupTask = WorkflowStatisticsRollupTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [workflow_statistics_rollup_service_1.WorkflowStatisticsRollupService, config_1.SchedulerConfig])
], WorkflowStatisticsRollupTask);
//# sourceMappingURL=workflow-statistics-rollup.task.js.map