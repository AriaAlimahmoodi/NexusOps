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
exports.ExecutionPruningHardDeleteTask = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const executions_pruning_service_1 = require("./executions-pruning.service");
let ExecutionPruningHardDeleteTask = class ExecutionPruningHardDeleteTask {
    constructor(executionsConfig, pruningService) {
        this.executionsConfig = executionsConfig;
        this.pruningService = pruningService;
        this.name = 'execution-pruning-hard-delete';
        this.intervalSeconds = this.executionsConfig.pruneDataIntervals.hardDelete * constants_1.Time.minutes.toSeconds;
        this.schedule = (0, decorators_1.intervalFromSeconds)(this.intervalSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: {
                retryOnFailure: true,
                timeoutSeconds: this.intervalSeconds,
            },
            leaderTimer: {
                retryDelaySeconds: 1,
            },
        });
    }
    async run(signal) {
        await this.pruningService.hardDelete(signal);
    }
};
exports.ExecutionPruningHardDeleteTask = ExecutionPruningHardDeleteTask;
exports.ExecutionPruningHardDeleteTask = ExecutionPruningHardDeleteTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [config_1.ExecutionsConfig, executions_pruning_service_1.ExecutionsPruningService])
], ExecutionPruningHardDeleteTask);
//# sourceMappingURL=execution-pruning-hard-delete.task.js.map