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
exports.ExecutionCrashService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const workflow_statistics_service_1 = require("../services/workflow-statistics.service");
let ExecutionCrashService = class ExecutionCrashService {
    constructor(executionRepository, workflowStatisticsService, eventService, instanceSettings) {
        this.executionRepository = executionRepository;
        this.workflowStatisticsService = workflowStatisticsService;
        this.eventService = eventService;
        this.instanceSettings = instanceSettings;
    }
    async markAsCrashed(executionIds, detector) {
        return await this.executionRepository.markAsCrashed(executionIds, (batch) => {
            this.count(batch);
            this.announce(batch, detector);
        });
    }
    async markAsCrashedWithoutCounting(executionIds, detector, options = {}) {
        return await this.executionRepository.markAsCrashed(executionIds, (batch) => this.announce(batch, detector, options.stoppedAt));
    }
    async markWorkflowExecutionsAsCrashed(workflowId) {
        const crashed = await this.executionRepository.markWorkflowExecutionsAsCrashed(workflowId);
        this.count(crashed);
        this.announce(crashed, 'workflow-deactivation');
        return crashed;
    }
    count(executions) {
        if (executions.length === 0)
            return;
        this.workflowStatisticsService.emit('executionsCrashed', { executions });
    }
    announce(executions, detector, stoppedAtOverride) {
        for (const { id, workflowId, workflowName, workflowVersionId, mode, retryOf, startedAt, stoppedAt, tracingContext, workflowCustomTelemetryTags, project, } of executions) {
            this.eventService.emit('execution-crashed', {
                executionId: id,
                workflowId,
                workflowName,
                workflowVersionId,
                mode,
                retryOf,
                startedAt: startedAt ?? undefined,
                stoppedAt: stoppedAtOverride ?? stoppedAt,
                detector,
                hostId: this.instanceSettings.hostId,
                tracingContext,
                workflowCustomTelemetryTags,
                project,
            });
        }
    }
};
exports.ExecutionCrashService = ExecutionCrashService;
exports.ExecutionCrashService = ExecutionCrashService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ExecutionRepository, workflow_statistics_service_1.WorkflowStatisticsService, backend_services_1.EventService, n8n_core_1.InstanceSettings])
], ExecutionCrashService);
//# sourceMappingURL=execution-crash.service.js.map