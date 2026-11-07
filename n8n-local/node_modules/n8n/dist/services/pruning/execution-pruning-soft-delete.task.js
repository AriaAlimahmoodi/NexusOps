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
exports.ExecutionPruningSoftDeleteTask = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const executions_pruning_service_1 = require("./executions-pruning.service");
let ExecutionPruningSoftDeleteTask = class ExecutionPruningSoftDeleteTask {
    constructor(executionsConfig, databaseConfig, pruningService) {
        this.executionsConfig = executionsConfig;
        this.databaseConfig = databaseConfig;
        this.pruningService = pruningService;
        this.name = 'execution-pruning-soft-delete';
        this.schedule = (0, decorators_1.intervalFromSeconds)(this.executionsConfig.pruneDataIntervals.softDelete * constants_1.Time.minutes.toSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: {
                retryOnFailure: true,
                timeoutSeconds: (0, decorators_1.timeoutAfterLimit)((0, config_1.statementTimeoutSeconds)(this.databaseConfig), 5 * constants_1.Time.minutes.toSeconds),
            },
        });
    }
    async run() {
        await this.pruningService.softDelete();
    }
};
exports.ExecutionPruningSoftDeleteTask = ExecutionPruningSoftDeleteTask;
exports.ExecutionPruningSoftDeleteTask = ExecutionPruningSoftDeleteTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [config_1.ExecutionsConfig, config_1.DatabaseConfig, executions_pruning_service_1.ExecutionsPruningService])
], ExecutionPruningSoftDeleteTask);
//# sourceMappingURL=execution-pruning-soft-delete.task.js.map