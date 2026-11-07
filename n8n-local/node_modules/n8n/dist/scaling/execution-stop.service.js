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
exports.ExecutionStopService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const active_executions_1 = require("../active-executions");
const publisher_service_1 = require("./pubsub/publisher.service");
let ExecutionStopService = class ExecutionStopService {
    constructor(logger, instanceSettings, publisher, activeExecutions) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.publisher = publisher;
        this.activeExecutions = activeExecutions;
        this.logger = this.logger.scoped('scaling');
    }
    async requestStop(executionId) {
        if (this.instanceSettings.instanceType !== 'main')
            return;
        await this.publisher.publishCommand({
            command: 'stop-execution',
            payload: { executionId },
        });
    }
    handleStopExecution({ executionId }) {
        if (!this.activeExecutions.has(executionId))
            return;
        this.logger.debug('Stopping execution on worker after stop-execution command', {
            executionId,
        });
        this.activeExecutions.stopExecution(executionId, new n8n_workflow_1.ManualExecutionCancelledError(executionId));
    }
};
exports.ExecutionStopService = ExecutionStopService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('stop-execution', { instanceType: 'worker' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExecutionStopService.prototype, "handleStopExecution", null);
exports.ExecutionStopService = ExecutionStopService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, publisher_service_1.Publisher, active_executions_1.ActiveExecutions])
], ExecutionStopService);
//# sourceMappingURL=execution-stop.service.js.map