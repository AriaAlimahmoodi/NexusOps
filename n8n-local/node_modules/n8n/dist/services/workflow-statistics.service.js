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
exports.WorkflowStatisticsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const user_service_1 = require("../services/user.service");
const ownership_service_1 = require("./ownership.service");
function getStatisticsNameForCompletedRun(runData, source) {
    const isChatExecution = runData.mode === 'chat';
    if (isChatExecution || !(0, n8n_workflow_1.isCompletedExecutionStatus)(runData.status)) {
        return null;
    }
    const isManualExecution = runData.mode === 'manual' || source === 'instance_ai';
    if (isManualExecution) {
        return runData.status === 'success'
            ? "manual_success" : "manual_error";
    }
    return runData.status === 'success'
        ? "production_success" : "production_error";
}
let WorkflowStatisticsService = class WorkflowStatisticsService extends backend_common_1.TypedEmitter {
    constructor(logger, repository, ownershipService, userService, eventService, settingsRepository, workflowRepository, databaseConfig) {
        super({ captureRejections: true });
        this.logger = logger;
        this.repository = repository;
        this.ownershipService = ownershipService;
        this.userService = userService;
        this.eventService = eventService;
        this.settingsRepository = settingsRepository;
        this.workflowRepository = workflowRepository;
        this.databaseConfig = databaseConfig;
        if ('SKIP_STATISTICS_EVENTS' in process.env)
            return;
        this.on('nodeFetchedData', async ({ workflowId, node, source }) => await this.nodeFetchedData(workflowId, node, source));
        this.on('workflowExecutionCompleted', async ({ workflowData, fullRunData, source }) => await this.workflowExecutionCompleted(workflowData, fullRunData, source));
        this.on('executionsCrashed', async ({ executions }) => {
            for (const { workflowId, workflowName, mode } of executions) {
                await this.recordExecutionOutcome({ workflowId, workflowName, mode, status: 'crashed' });
            }
        });
    }
    async workflowExecutionCompleted(workflowData, runData, source) {
        const statisticsName = getStatisticsNameForCompletedRun(runData, source);
        const isRoot = (0, backend_services_1.isBillableExecution)(runData, source);
        if (!statisticsName)
            return;
        const workflowId = workflowData.id;
        if (!workflowId)
            return;
        await this.recordCompletedRun({
            statisticsName,
            workflowId,
            workflowName: workflowData.name,
            isRoot,
            firstEventMs: runData.startedAt.getTime(),
        });
    }
    async recordExecutionOutcome({ workflowId, workflowName, mode, status, }) {
        try {
            const outcome = { mode, status };
            const statisticsName = getStatisticsNameForCompletedRun(outcome);
            if (!statisticsName)
                return;
            await this.recordCompletedRun({
                statisticsName,
                workflowId,
                workflowName,
                isRoot: (0, backend_services_1.isBillableExecution)(outcome),
                firstEventMs: Date.now(),
            });
        }
        catch (error) {
            this.logger.error('Failed to record the outcome of an execution', {
                workflowId,
                error: (0, ensure_error_1.ensureError)(error),
            });
        }
    }
    async recordCompletedRun({ statisticsName, workflowId, workflowName, isRoot, firstEventMs, }) {
        let upsertResult;
        try {
            if (this.databaseConfig.type === 'postgresdb') {
                await this.repository.appendIncrement(statisticsName, workflowId, isRoot, workflowName);
                return;
            }
            upsertResult = await this.repository.upsertWorkflowStatistics(statisticsName, workflowId, isRoot, workflowName);
        }
        catch (error) {
            this.logger.error('Failed to record workflow statistic', { error: (0, ensure_error_1.ensureError)(error) });
            return;
        }
        if (upsertResult !== 'insert')
            return;
        try {
            await this.emitFirstOccurrenceEvent(statisticsName, workflowId, workflowName ?? null, firstEventMs);
        }
        catch (error) {
            this.logger.debug('Failed to emit workflow statistics milestone', {
                error: (0, ensure_error_1.ensureError)(error),
            });
        }
    }
    async emitFirstOccurrenceEvent(statisticsName, workflowId, workflowName, firstEventMs) {
        if (statisticsName === "production_success") {
            await this.emitFirstProductionWorkflowSucceeded(workflowId, firstEventMs);
            return;
        }
        if (statisticsName === "production_error") {
            await this.emitInstanceFirstProductionWorkflowFailed(workflowId, workflowName ?? '', firstEventMs);
        }
    }
    async emitFirstProductionWorkflowSucceeded(workflowId, userActivatedAtMs) {
        const project = await this.ownershipService.getWorkflowProjectCached(workflowId);
        let userId = null;
        if (project.type === 'personal') {
            const owner = await this.ownershipService.getPersonalProjectOwnerCached(project.id);
            userId = owner?.id ?? null;
            if (owner && !owner.settings?.userActivated) {
                await this.userService.updateSettings(owner.id, {
                    firstSuccessfulWorkflowId: workflowId,
                    userActivated: true,
                    userActivatedAt: userActivatedAtMs,
                });
            }
        }
        this.eventService.emit('first-production-workflow-succeeded', {
            projectId: project.id,
            workflowId,
            userId,
        });
    }
    async emitInstanceFirstProductionWorkflowFailed(workflowId, workflowName, timestampMs) {
        const instanceHadProductionFailure = await this.settingsRepository.findByKey('instance.firstProductionFailure');
        if (instanceHadProductionFailure ||
            (await this.workflowRepository.hasAnyWorkflowsWithErrorWorkflow())) {
            return;
        }
        const project = await this.ownershipService.getWorkflowProjectCached(workflowId);
        let owner = project.type === 'personal'
            ? await this.ownershipService.getPersonalProjectOwnerCached(project.id)
            : null;
        owner ??= await this.ownershipService.getInstanceOwner();
        const isFirstFailure = await this.settingsRepository.insertIfAbsent('instance.firstProductionFailure', JSON.stringify({
            workflowId,
            projectId: project.id,
            userId: owner.id,
            timestamp: timestampMs,
        }));
        if (!isFirstFailure) {
            return;
        }
        this.eventService.emit('instance-first-production-workflow-failed', {
            projectId: project.id,
            workflowId,
            workflowName,
            userId: owner.id,
        });
    }
    async nodeFetchedData(workflowId, node, source) {
        if (!workflowId)
            return;
        if (source === 'instance_ai')
            return;
        const insertResult = await this.repository.insertWorkflowStatistics("data_loaded", workflowId);
        if (insertResult === 'failed' || insertResult === 'alreadyExists')
            return;
        const project = await this.ownershipService.getWorkflowProjectCached(workflowId);
        const owner = await this.ownershipService.getPersonalProjectOwnerCached(project.id);
        let metrics = {
            userId: owner?.id ?? '',
            project: project.id,
            workflowId,
            nodeType: node.type,
            nodeId: node.id,
        };
        if (node.credentials) {
            Object.entries(node.credentials).forEach(([credName, credDetails]) => {
                metrics = Object.assign(metrics, {
                    credentialType: credName,
                    credentialId: credDetails.id,
                });
            });
        }
        this.eventService.emit('first-workflow-data-loaded', metrics);
    }
};
exports.WorkflowStatisticsService = WorkflowStatisticsService;
exports.WorkflowStatisticsService = WorkflowStatisticsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WorkflowStatisticsRepository, ownership_service_1.OwnershipService, user_service_1.UserService, backend_services_1.EventService, db_1.SettingsRepository, db_1.WorkflowRepository, config_1.DatabaseConfig])
], WorkflowStatisticsService);
//# sourceMappingURL=workflow-statistics.service.js.map