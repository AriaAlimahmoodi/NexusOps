"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleTriggerTaskHandler = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const duplicate_execution_error_1 = require("../../errors/duplicate-execution.error");
const ownership_service_1 = require("../../services/ownership.service");
const WorkflowExecuteAdditionalData = __importStar(require("../../workflow-execute-additional-data"));
const trigger_execution_context_factory_1 = require("../../workflows/triggers/trigger-execution-context.factory");
const utils_1 = require("../../workflows/utils");
const workflow_execution_service_1 = require("../../workflows/workflow-execution.service");
const workflow_publisher_service_1 = require("../../workflows/workflow-publisher.service");
const resolve_task_trigger_node_1 = require("../resolve-task-trigger-node");
const schedule_trigger_task_1 = require("./schedule-trigger-task");
let ScheduleTriggerTaskHandler = class ScheduleTriggerTaskHandler {
    constructor(logger, errorReporter, globalConfig, executionRepository, eventService, triggerExecutionContextFactory, workflowExecutionService, ownershipService, workflowPublisherService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.globalConfig = globalConfig;
        this.executionRepository = executionRepository;
        this.eventService = eventService;
        this.triggerExecutionContextFactory = triggerExecutionContextFactory;
        this.workflowExecutionService = workflowExecutionService;
        this.ownershipService = ownershipService;
        this.workflowPublisherService = workflowPublisherService;
        this.taskType = schedule_trigger_task_1.SCHEDULE_TRIGGER_TASK_TYPE;
        this.logger = this.logger.scoped('scheduler');
    }
    async execute(task, report) {
        const { workflowId, nodeId } = this.parsePayload(task);
        const workflowData = await this.triggerExecutionContextFactory.findPublishedWorkflowData(workflowId);
        if (workflowData === null) {
            this.logger.debug('Workflow has no published version. Skipping the occurrence', {
                taskId: task.id,
                jobId: task.jobId,
                workflowId,
                nodeId,
            });
            return report.notDispatched();
        }
        const node = (0, resolve_task_trigger_node_1.resolveTaskTriggerNode)(workflowData, nodeId, task, 'Schedule-trigger task points to a node that is missing or disabled in the published workflow');
        const deduplicationKey = (0, schedule_trigger_task_1.scheduleTriggerDeduplicationKey)(task);
        const settingsTimezone = workflowData.settings?.timezone;
        const timezone = settingsTimezone && settingsTimezone !== 'DEFAULT'
            ? settingsTimezone
            : this.globalConfig.generic.timezone;
        const item = node.type === n8n_workflow_1.CRON_NODE_TYPE
            ? { json: {} }
            : (0, schedule_trigger_task_1.buildScheduleTriggerItem)(task.scheduledFor, timezone);
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            workflowId,
            workflowSettings: workflowData.settings,
            userId: await this.workflowPublisherService.findPublisherUserId(workflowId, workflowData.versionId),
        });
        try {
            const executionId = await this.workflowExecutionService.runWorkflow(workflowData, node, [[item]], additionalData, 'trigger', undefined, deduplicationKey);
            const decision = report.dispatched();
            const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, workflowData.id);
            this.eventService.emit('workflow-executed', {
                workflowId,
                workflowName: workflowData.name,
                executionId,
                projectId,
                projectName,
                source: 'trigger',
            });
            this.logger.debug('Handed off scheduled occurrence to a new execution', {
                taskId: task.id,
                jobId: task.jobId,
                workflowId,
                executionId,
                deduplicationKey,
            });
            return decision;
        }
        catch (error) {
            if (!(error instanceof duplicate_execution_error_1.DuplicateExecutionError)) {
                throw error;
            }
            await this.recordExistingHandoff(task, error);
            return report.notDispatched();
        }
    }
    parsePayload(task) {
        if (!(0, schedule_trigger_task_1.isScheduleTriggerTaskPayload)(task.payload)) {
            throw new n8n_workflow_1.UnexpectedError('Schedule-trigger task payload is missing workflowId or nodeId', {
                extra: { taskId: task.id, jobId: task.jobId },
            });
        }
        return task.payload;
    }
    async recordExistingHandoff(task, error) {
        const { deduplicationKey } = error;
        const existing = await this.executionRepository.findOne({
            where: { deduplicationKey },
            select: ['id', 'status'],
        });
        const context = {
            taskId: task.id,
            jobId: task.jobId,
            attempts: task.attempts,
            deduplicationKey,
            executionId: existing?.id,
            executionStatus: existing?.status,
        };
        this.logger.warn('Occurrence redelivered after a previously recorded execution; skipping', context);
        this.errorReporter.warn(error, { extra: context, shouldBeLogged: false });
    }
};
exports.ScheduleTriggerTaskHandler = ScheduleTriggerTaskHandler;
exports.ScheduleTriggerTaskHandler = ScheduleTriggerTaskHandler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, config_1.GlobalConfig, db_1.ExecutionRepository, backend_services_1.EventService, trigger_execution_context_factory_1.TriggerExecutionContextFactory, workflow_execution_service_1.WorkflowExecutionService, ownership_service_1.OwnershipService, workflow_publisher_service_1.WorkflowPublisherService])
], ScheduleTriggerTaskHandler);
//# sourceMappingURL=schedule-trigger-task-handler.js.map