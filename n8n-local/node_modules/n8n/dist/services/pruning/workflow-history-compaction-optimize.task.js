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
exports.WorkflowHistoryCompactionOptimizeTask = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const workflow_history_compaction_service_1 = require("./workflow-history-compaction.service");
let WorkflowHistoryCompactionOptimizeTask = class WorkflowHistoryCompactionOptimizeTask {
    constructor(config, compactionService) {
        this.config = config;
        this.compactionService = compactionService;
        this.name = 'workflow-history-compaction-optimize';
        this.schedule = (0, decorators_1.intervalFromSeconds)((this.config.optimizingTimeWindowHours / 2) * constants_1.Time.hours.toSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: {
                retryOnFailure: true,
                timeoutSeconds: 30 * constants_1.Time.minutes.toSeconds,
            },
        });
    }
    async run(signal) {
        await this.compactionService.optimizeHistories(signal);
    }
};
exports.WorkflowHistoryCompactionOptimizeTask = WorkflowHistoryCompactionOptimizeTask;
exports.WorkflowHistoryCompactionOptimizeTask = WorkflowHistoryCompactionOptimizeTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [config_1.WorkflowHistoryCompactionConfig, workflow_history_compaction_service_1.WorkflowHistoryCompactionService])
], WorkflowHistoryCompactionOptimizeTask);
//# sourceMappingURL=workflow-history-compaction-optimize.task.js.map