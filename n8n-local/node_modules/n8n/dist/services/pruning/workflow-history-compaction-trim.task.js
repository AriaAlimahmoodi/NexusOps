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
exports.WorkflowHistoryCompactionTrimTask = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const workflow_history_compaction_service_1 = require("./workflow-history-compaction.service");
let WorkflowHistoryCompactionTrimTask = class WorkflowHistoryCompactionTrimTask {
    constructor(compactionService) {
        this.compactionService = compactionService;
        this.name = 'workflow-history-compaction-trim';
        this.schedule = {
            kind: 'cron',
            cronExpression: '0 3 * * *',
            timezone: null,
        };
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: {
                retryOnFailure: true,
                missedAfterSeconds: constants_1.Time.hours.toSeconds,
                timeoutSeconds: constants_1.Time.hours.toSeconds,
            },
        });
    }
    async run(signal) {
        await this.compactionService.trimLongRunningHistories(signal);
    }
};
exports.WorkflowHistoryCompactionTrimTask = WorkflowHistoryCompactionTrimTask;
exports.WorkflowHistoryCompactionTrimTask = WorkflowHistoryCompactionTrimTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [workflow_history_compaction_service_1.WorkflowHistoryCompactionService])
], WorkflowHistoryCompactionTrimTask);
//# sourceMappingURL=workflow-history-compaction-trim.task.js.map