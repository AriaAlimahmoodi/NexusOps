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
exports.EnqueuedExecutionRecoveryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_assert_1 = require("node:assert");
const execution_already_resuming_error_1 = require("../errors/execution-already-resuming.error");
const execution_crash_service_1 = require("../executions/execution-crash.service");
const execution_service_1 = require("../executions/execution.service");
const ownership_service_1 = require("../services/ownership.service");
const workflow_publisher_service_1 = require("../workflows/workflow-publisher.service");
const workflow_runner_1 = require("../workflow-runner");
let EnqueuedExecutionRecoveryService = class EnqueuedExecutionRecoveryService {
    constructor(logger, errorReporter, executionsConfig, executionService, executionCrashService, ownershipService, workflowPublisherService, workflowRunner, eventService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.executionsConfig = executionsConfig;
        this.executionService = executionService;
        this.executionCrashService = executionCrashService;
        this.ownershipService = ownershipService;
        this.workflowPublisherService = workflowPublisherService;
        this.workflowRunner = workflowRunner;
        this.eventService = eventService;
        this.logger = this.logger.scoped('enqueued-execution-recovery');
    }
    async recoverEnqueuedExecutions() {
        (0, node_assert_1.strict)(this.executionsConfig.mode === 'regular', 'Enqueued execution recovery must not run in queue mode');
        const { executions, unreadableIds } = await this.executionService.findAllEnqueuedExecutions();
        if (unreadableIds.length > 0) {
            this.logger.warn('Crashing enqueued executions with unreadable data', {
                executionIds: unreadableIds,
            });
            await this.executionCrashService.markAsCrashed(unreadableIds, 'start-failure');
        }
        if (executions.length === 0)
            return;
        this.logger.debug('Found enqueued executions to run', {
            executionIds: executions.map((e) => e.id),
        });
        for (const execution of executions) {
            const executionId = execution.id;
            try {
                const project = await this.ownershipService.getWorkflowProjectCached(execution.workflowId);
                const data = {
                    executionMode: execution.mode,
                    executionData: execution.data,
                    workflowData: execution.workflowData,
                    projectId: project.id,
                    userId: await this.workflowPublisherService.findActingUserIdForRestart(execution),
                };
                this.eventService.emit('execution-started-during-bootup', { executionId });
                void this.workflowRunner
                    .run(data, undefined, false, {
                    executionId,
                    expectedStatus: 'new',
                    storedAt: execution.storedAt,
                })
                    .catch(async (error) => await this.crashUnstartableExecution(executionId, error));
            }
            catch (error) {
                await this.crashUnstartableExecution(executionId, error);
            }
        }
    }
    async crashUnstartableExecution(executionId, error) {
        if (error instanceof execution_already_resuming_error_1.ExecutionAlreadyResumingError) {
            this.logger.debug('Execution was already claimed, skipping recovery', { executionId });
            return;
        }
        this.errorReporter.error(error, { executionId, shouldBeLogged: false });
        this.logger.error('Failed to run enqueued execution', { executionId, error });
        await this.executionCrashService.markAsCrashed(executionId, 'start-failure');
    }
};
exports.EnqueuedExecutionRecoveryService = EnqueuedExecutionRecoveryService;
exports.EnqueuedExecutionRecoveryService = EnqueuedExecutionRecoveryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, config_1.ExecutionsConfig, execution_service_1.ExecutionService, execution_crash_service_1.ExecutionCrashService, ownership_service_1.OwnershipService, workflow_publisher_service_1.WorkflowPublisherService, workflow_runner_1.WorkflowRunner, backend_services_1.EventService])
], EnqueuedExecutionRecoveryService);
//# sourceMappingURL=enqueued-execution-recovery.service.js.map