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
exports.WorkflowHistoryPruningTask = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const workflow_history_manager_1 = require("../../workflows/workflow-history/workflow-history-manager");
let WorkflowHistoryPruningTask = class WorkflowHistoryPruningTask {
    constructor(databaseConfig, workflowHistoryManager) {
        this.databaseConfig = databaseConfig;
        this.workflowHistoryManager = workflowHistoryManager;
        this.name = 'workflow-history-pruning';
        this.schedule = (0, decorators_1.intervalFromSeconds)(constants_1.Time.hours.toSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: {
                retryOnFailure: true,
                timeoutSeconds: (0, decorators_1.timeoutAfterLimit)((0, config_1.statementTimeoutSeconds)(this.databaseConfig), 5 * constants_1.Time.minutes.toSeconds),
            },
            leaderTimer: {
                runOnTakeover: true,
            },
        });
    }
    async run() {
        await this.workflowHistoryManager.prune();
    }
};
exports.WorkflowHistoryPruningTask = WorkflowHistoryPruningTask;
exports.WorkflowHistoryPruningTask = WorkflowHistoryPruningTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [config_1.DatabaseConfig, workflow_history_manager_1.WorkflowHistoryManager])
], WorkflowHistoryPruningTask);
//# sourceMappingURL=workflow-history-pruning.task.js.map