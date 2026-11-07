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
exports.WaitTracker = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const active_executions_1 = require("./active-executions");
const execution_already_resuming_error_1 = require("./errors/execution-already-resuming.error");
const execution_persistence_1 = require("./executions/execution-persistence");
const ownership_service_1 = require("./services/ownership.service");
const workflow_publisher_service_1 = require("./workflows/workflow-publisher.service");
const workflow_runner_1 = require("./workflow-runner");
const workflow_helpers_1 = require("./workflow-helpers");
const MAX_PARENT_RESUME_ATTEMPTS = 3;
function isRetryableResumeError(error) {
    return !(error instanceof n8n_workflow_1.UserError || error instanceof n8n_workflow_1.UnexpectedError);
}
let WaitTracker = class WaitTracker {
    constructor(logger, executionRepository, executionPersistence, ownershipService, workflowPublisherService, activeExecutions, workflowRunner, instanceSettings) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.ownershipService = ownershipService;
        this.workflowPublisherService = workflowPublisherService;
        this.activeExecutions = activeExecutions;
        this.workflowRunner = workflowRunner;
        this.instanceSettings = instanceSettings;
        this.waitingExecutions = {};
        this.resumingParkedParents = false;
        this.logger = this.logger.scoped('waiting-executions');
    }
    has(executionId) {
        return this.waitingExecutions[executionId] !== undefined;
    }
    getDiagnosticCounts() {
        return { waitingExecutions: Object.keys(this.waitingExecutions).length };
    }
    init() {
        if (this.instanceSettings.isLeader)
            this.startTracking();
    }
    startTracking() {
        this.mainTimer = setInterval(() => {
            void this.getWaitingExecutions();
            void this.resumeParentsOfFinishedSubExecutions();
        }, 60000);
        void this.getWaitingExecutions();
        void this.resumeParentsOfFinishedSubExecutions();
        this.logger.debug('Started tracking waiting executions');
    }
    async getWaitingExecutions() {
        this.logger.debug('Querying database for waiting executions');
        const executions = await this.executionRepository.getWaitingExecutions();
        if (executions.length === 0) {
            return;
        }
        const executionIds = executions.map((execution) => execution.id).join(', ');
        this.logger.debug(`Found ${executions.length} executions. Setting timer for IDs: ${executionIds}`);
        for (const execution of executions) {
            const executionId = execution.id;
            if (this.waitingExecutions[executionId] === undefined) {
                const triggerTime = execution.waitTill.getTime() - new Date().getTime();
                this.waitingExecutions[executionId] = {
                    executionId,
                    timer: setTimeout(() => {
                        void this.startExecution(executionId).catch((error) => {
                            if (error instanceof execution_already_resuming_error_1.ExecutionAlreadyResumingError) {
                                this.logger.info('Execution already claimed by another process, skipping', {
                                    executionId,
                                });
                                return;
                            }
                            this.logger.error('Failed to start waiting execution', {
                                executionId,
                                error: (0, ensure_error_1.ensureError)(error).message,
                            });
                        });
                    }, triggerTime),
                };
            }
        }
    }
    stopExecution(executionId) {
        if (!this.waitingExecutions[executionId])
            return;
        clearTimeout(this.waitingExecutions[executionId].timer);
        delete this.waitingExecutions[executionId];
    }
    async startExecution(executionId) {
        this.logger.debug(`Resuming execution ${executionId}`, { executionId });
        delete this.waitingExecutions[executionId];
        const fullExecutionData = await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        if (!fullExecutionData) {
            throw new n8n_workflow_1.UnexpectedError('Execution does not exist.', { extra: { executionId } });
        }
        if (fullExecutionData.finished) {
            throw new n8n_workflow_1.UnexpectedError('The execution did succeed and can so not be started again.');
        }
        if (!fullExecutionData.workflowData.id) {
            throw new n8n_workflow_1.UnexpectedError('Only saved workflows can be resumed.');
        }
        if (fullExecutionData.data.waitReason === 'suspended') {
            if (fullExecutionData.status !== 'waiting') {
                throw new execution_already_resuming_error_1.ExecutionAlreadyResumingError(executionId);
            }
            if (this.activeExecutions.has(executionId)) {
                await this.activeExecutions.getPostExecutePromise(executionId);
            }
        }
        const workflowId = fullExecutionData.workflowData.id;
        const project = await this.ownershipService.getWorkflowProjectCached(workflowId);
        const data = {
            executionMode: fullExecutionData.mode,
            executionData: fullExecutionData.data,
            workflowData: fullExecutionData.workflowData,
            projectId: project.id,
            pushRef: fullExecutionData.data.pushRef,
            startedAt: fullExecutionData.startedAt,
            callerAwaitsOutcome: 'none',
            userId: await this.workflowPublisherService.findActingUserIdForRestart(fullExecutionData),
        };
        await this.workflowRunner.run(data, false, false, {
            executionId,
            expectedStatus: 'waiting',
            storedAt: fullExecutionData.storedAt,
        });
        const { parentExecution } = fullExecutionData.data;
        if ((0, workflow_helpers_1.shouldRestartParentExecution)(parentExecution)) {
            void this.resumeParentExecution(parentExecution, this.activeExecutions.getPostExecutePromise(executionId), { executionId, workflowId }, fullExecutionData.workflowData);
        }
    }
    async resumeParentExecution(parentExecution, executePromise, childExecution, childWorkflowData) {
        try {
            const subworkflowResults = await executePromise;
            if (!subworkflowResults)
                return;
            if (subworkflowResults.status === 'waiting')
                return;
            const patched = await this.patchParent(parentExecution.executionId, subworkflowResults, childExecution, childWorkflowData);
            if (!patched) {
                this.logger.info('Parent not patched with the sub-execution result, not claiming it', {
                    parentExecutionId: parentExecution.executionId,
                    childExecutionId: childExecution?.executionId,
                });
                return;
            }
            await this.claimParent(parentExecution.executionId, childExecution);
        }
        catch (error) {
            this.logger.error('Failed to resume parent execution after sub-workflow completed', {
                parentExecutionId: parentExecution.executionId,
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
    async patchParent(parentExecutionId, subworkflowResults, childExecution, childWorkflowData) {
        let patched = false;
        await this.withRetry(async () => {
            patched = await (0, workflow_helpers_1.updateParentExecutionWithChildResults)(parentExecutionId, subworkflowResults, childExecution, childWorkflowData);
        }, MAX_PARENT_RESUME_ATTEMPTS, isRetryableResumeError);
        return patched;
    }
    async claimParent(parentExecutionId, childExecution) {
        try {
            await this.withRetry(async () => await this.startExecution(parentExecutionId), MAX_PARENT_RESUME_ATTEMPTS, (error) => !(error instanceof execution_already_resuming_error_1.ExecutionAlreadyResumingError) && isRetryableResumeError(error));
        }
        catch (error) {
            if (error instanceof execution_already_resuming_error_1.ExecutionAlreadyResumingError) {
                this.logger.info('Parent execution not claimable: already claimed by another process, or not parked yet', { parentExecutionId, childExecutionId: childExecution?.executionId });
                return;
            }
            throw error;
        }
    }
    async resumeParentsOfFinishedSubExecutions() {
        if (this.resumingParkedParents) {
            this.logger.debug('Still sweeping parents parked on a sub-execution, skipping this tick');
            return;
        }
        this.resumingParkedParents = true;
        try {
            let parentIds;
            try {
                parentIds = await this.executionRepository.findParkedOnSubExecution();
            }
            catch (error) {
                this.logger.error('Failed to query executions parked on a sub-execution', {
                    error: (0, ensure_error_1.ensureError)(error).message,
                });
                return;
            }
            for (const parentId of parentIds) {
                try {
                    await this.resumeParentIfChildFinished(parentId);
                }
                catch (error) {
                    this.logger.error('Failed to resume parent execution parked on a sub-execution', {
                        parentExecutionId: parentId,
                        error: (0, ensure_error_1.ensureError)(error).message,
                    });
                }
            }
        }
        finally {
            this.resumingParkedParents = false;
        }
    }
    async resumeParentIfChildFinished(parentId) {
        const parent = await this.executionPersistence.findSingleExecution(parentId, {
            includeData: true,
            unflattenData: true,
        });
        const childIds = parent?.data.executionData?.nodeExecutionStack[0]?.metadata?.waitingChildExecutionIds;
        if (!childIds?.length)
            return;
        const statuses = await this.executionRepository.findStatusesByIds(childIds);
        const missing = childIds.filter((id) => !statuses.some((row) => row.id === id));
        if (missing.length > 0) {
            this.logger.warn('Parent execution waits on sub-executions that no longer exist', {
                parentExecutionId: parentId,
                childExecutionIds: missing,
            });
        }
        const finished = statuses.find((row) => (0, n8n_workflow_1.isTerminalExecutionStatus)(row.status));
        if (!finished)
            return;
        const child = await this.executionPersistence.findSingleExecution(finished.id, {
            includeData: true,
            unflattenData: true,
        });
        if (!child) {
            this.logger.warn('Finished sub-execution no longer exists', {
                parentExecutionId: parentId,
                childExecutionId: finished.id,
            });
            return;
        }
        const childRun = {
            data: child.data,
            mode: child.mode,
            startedAt: child.startedAt,
            stoppedAt: child.stoppedAt,
            status: child.status,
            finished: child.finished,
            storedAt: child.storedAt,
        };
        const childExecution = { executionId: child.id, workflowId: child.workflowId };
        if (!(await this.patchParent(parentId, childRun, childExecution, child.workflowData))) {
            this.logger.warn('Parent not patched with the sub-execution result, leaving it parked', {
                parentExecutionId: parentId,
                childExecutionId: child.id,
                childStatus: child.status,
            });
            return;
        }
        await this.claimParent(parentId, childExecution);
    }
    async withRetry(operation, maxAttempts, shouldRetry = () => true) {
        for (let attempt = 1;; attempt++) {
            try {
                await operation();
                return;
            }
            catch (error) {
                if (attempt >= maxAttempts || !shouldRetry(error))
                    throw error;
                await (0, sleep_1.sleep)(100 * 2 ** (attempt - 1));
            }
        }
    }
    stopTracking() {
        if (!this.mainTimer)
            return;
        clearInterval(this.mainTimer);
        Object.keys(this.waitingExecutions).forEach((executionId) => {
            clearTimeout(this.waitingExecutions[executionId].timer);
        });
        this.logger.debug('Stopped tracking waiting executions');
    }
};
exports.WaitTracker = WaitTracker;
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WaitTracker.prototype, "startTracking", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WaitTracker.prototype, "stopTracking", null);
exports.WaitTracker = WaitTracker = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, ownership_service_1.OwnershipService, workflow_publisher_service_1.WorkflowPublisherService, active_executions_1.ActiveExecutions, workflow_runner_1.WorkflowRunner, n8n_core_1.InstanceSettings])
], WaitTracker);
//# sourceMappingURL=wait-tracker.js.map