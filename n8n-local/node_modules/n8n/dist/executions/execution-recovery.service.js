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
exports.ExecutionRecoveryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const node_crashed_error_1 = require("../errors/node-crashed.error");
const workflow_crashed_error_1 = require("../errors/workflow-crashed.error");
const execution_lifecycle_hooks_1 = require("../execution-lifecycle/execution-lifecycle-hooks");
const execution_crash_service_1 = require("../executions/execution-crash.service");
const execution_persistence_1 = require("../executions/execution-persistence");
const push_1 = require("../push");
const ownership_service_1 = require("../services/ownership.service");
const user_management_mailer_1 = require("../user-management/email/user-management-mailer");
const workflow_push_notifier_service_1 = require("../workflows/workflow-push-notifier.service");
const event_message_classes_1 = require("../eventbus/event-message-classes");
let ExecutionRecoveryService = class ExecutionRecoveryService {
    constructor(logger, instanceSettings, push, executionRepository, executionPersistence, executionsConfig, workflowRepository, userManagementMailer, ownershipService, projectRelationRepository, workflowPushNotifier, executionCrashService) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.push = push;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.executionsConfig = executionsConfig;
        this.workflowRepository = workflowRepository;
        this.userManagementMailer = userManagementMailer;
        this.ownershipService = ownershipService;
        this.projectRelationRepository = projectRelationRepository;
        this.workflowPushNotifier = workflowPushNotifier;
        this.executionCrashService = executionCrashService;
    }
    async autoDeactivateWorkflowsIfNeeded(workflowIds) {
        for (const workflowId of workflowIds) {
            const maxLastExecutions = this.executionsConfig.recovery.maxLastExecutions;
            const lastExecutions = await this.executionRepository.findMultipleExecutions({
                select: ['id', 'status'],
                where: { workflowId },
                order: { startedAt: 'DESC' },
                take: maxLastExecutions,
            });
            const numberOfCrashedExecutions = lastExecutions.filter((e) => e.status === 'crashed').length;
            if (lastExecutions.length >= maxLastExecutions &&
                lastExecutions.length === numberOfCrashedExecutions) {
                const workflow = await this.workflowRepository.findOne({ where: { id: workflowId } });
                if (!workflow) {
                    this.logger.warn(`Workflow ${workflowId} not found, skipping workflow auto-deactivation`);
                    continue;
                }
                if (workflow.activeVersionId !== null) {
                    try {
                        const { WorkflowService } = await import('../workflows/workflow.service.js');
                        await di_1.Container.get(WorkflowService).deactivateWorkflowAsSystem(workflowId);
                        this.logger.warn(`Autodeactivated workflow ${workflowId} due to too many crashed executions.`);
                        const recipient = await this.getAutodeactivationRecipient(workflow);
                        await this.userManagementMailer.notifyWorkflowAutodeactivated({
                            recipient,
                            workflow,
                        });
                        this.push.once('editorUiConnected', async () => {
                            await (0, sleep_1.sleep)(1000);
                            await this.workflowPushNotifier.notify(workflowId, {
                                type: 'workflowAutoDeactivated',
                                data: { workflowId },
                            });
                        });
                    }
                    catch (error) {
                        this.logger.error(`Failed to auto-deactivate workflow ${workflowId}`, {
                            workflowId,
                            error: (0, ensure_error_1.ensureError)(error),
                        });
                    }
                }
                await this.executionCrashService.markWorkflowExecutionsAsCrashed(workflowId);
            }
        }
    }
    async recoverFromLogs(executionId, messages) {
        if (this.instanceSettings.isFollower)
            return;
        const amendedExecution = await this.amend(executionId, messages);
        if (!amendedExecution)
            return null;
        this.logger.info('[Recovery] Logs available, amended execution', {
            executionId: amendedExecution.id,
        });
        await this.executionPersistence.updateExistingExecution(executionId, amendedExecution);
        await this.runHooks(amendedExecution);
        const { workflowId } = amendedExecution;
        this.push.once('editorUiConnected', async () => {
            await (0, sleep_1.sleep)(1000);
            await this.workflowPushNotifier.notify(workflowId, {
                type: 'executionRecovered',
                data: { executionId },
            });
        });
        return amendedExecution;
    }
    async amend(executionId, messages) {
        if (messages.length === 0)
            return await this.amendWithoutLogs(executionId);
        const { nodeMessagesByName, workflowMessages } = this.toRelevantMessages(messages);
        if (Object.keys(nodeMessagesByName).length === 0)
            return null;
        const execution = await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        if (!execution ||
            (['success', 'error', 'canceled', 'crashed'].includes(execution.status) && execution.data)) {
            return null;
        }
        const runExecutionData = execution.data ?? (0, n8n_workflow_1.createEmptyRunExecutionData)();
        runExecutionData.resultData.runData ??= {};
        for (const node of execution.workflowData.nodes) {
            const nodeMessages = nodeMessagesByName[node.name] ?? [];
            const nodeStartedMessage = nodeMessages.find((m) => m.payload.nodeName === node.name && m.eventName === 'n8n.node.started');
            if (!nodeStartedMessage)
                continue;
            const nodeHasRunData = runExecutionData.resultData.runData[node.name] !== undefined;
            if (nodeHasRunData)
                continue;
            const nodeFinishedMessage = nodeMessages.find((m) => m.payload.nodeName === node.name && m.eventName === 'n8n.node.finished');
            const taskData = {
                startTime: nodeStartedMessage.ts.toUnixInteger(),
                executionIndex: 0,
                executionTime: -1,
                source: [null],
            };
            if (nodeFinishedMessage) {
                taskData.executionStatus = 'success';
                taskData.data ??= constants_1.ARTIFICIAL_TASK_DATA;
                taskData.executionTime = nodeFinishedMessage.ts.diff(nodeStartedMessage.ts).toMillis();
            }
            else {
                taskData.executionStatus = 'crashed';
                taskData.error = new node_crashed_error_1.NodeCrashedError(node);
                taskData.executionTime = 0;
                runExecutionData.resultData.error = new workflow_crashed_error_1.WorkflowCrashedError();
            }
            runExecutionData.resultData.lastNodeExecuted = node.name;
            runExecutionData.resultData.runData[node.name] = [taskData];
        }
        const stoppedAt = this.toStoppedAt(this.latestNodeEventTs(nodeMessagesByName), workflowMessages);
        if (!['success', 'error', 'canceled'].includes(execution.status)) {
            const [claimed] = await this.executionCrashService.markAsCrashedWithoutCounting(executionId, 'startup-recovery', { stoppedAt });
            if (!claimed)
                return null;
        }
        return {
            ...execution,
            status: execution.status === 'error' ? 'error' : 'crashed',
            stoppedAt,
            waitTill: null,
            data: runExecutionData,
        };
    }
    async amendWithoutLogs(executionId) {
        const exists = await this.executionRepository.exists({ where: { id: executionId } });
        if (!exists)
            return null;
        await this.executionCrashService.markAsCrashedWithoutCounting(executionId, 'startup-recovery');
        const execution = await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        return execution ?? null;
    }
    toRelevantMessages(messages) {
        return messages.reduce((acc, cur) => {
            if ((0, event_message_classes_1.isNodeEventMessage)(cur)) {
                const nodeName = cur.payload.nodeName;
                acc.nodeMessagesByName[nodeName] ??= [];
                acc.nodeMessagesByName[nodeName].push(cur);
            }
            else if (cur.eventName.startsWith('n8n.workflow.')) {
                acc.workflowMessages.push(cur);
            }
            return acc;
        }, { nodeMessagesByName: {}, workflowMessages: [] });
    }
    latestNodeEventTs(nodeMessagesByName) {
        let latest;
        for (const { ts } of Object.values(nodeMessagesByName).flat()) {
            if (!latest || ts > latest)
                latest = ts;
        }
        return latest;
    }
    toStoppedAt(timestamp, messages) {
        if (timestamp)
            return timestamp.toJSDate();
        const WORKFLOW_END_EVENTS = new Set([
            'n8n.workflow.success',
            'n8n.workflow.crashed',
            'n8n.workflow.failed',
        ]);
        return (messages.find((m) => WORKFLOW_END_EVENTS.has(m.eventName)) ??
            messages.find((m) => m.eventName === 'n8n.workflow.started'))?.ts.toJSDate();
    }
    async runHooks(execution) {
        execution.data ??= (0, n8n_workflow_1.createEmptyRunExecutionData)();
        const lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForRegularMain)({
            userId: '',
            workflowData: execution.workflowData,
            executionMode: execution.mode,
            executionData: execution.data,
            runData: execution.data.resultData.runData,
            retryOf: execution.retryOf ?? undefined,
        }, execution.id);
        const run = {
            data: execution.data,
            finished: false,
            mode: execution.mode,
            waitTill: execution.waitTill ?? undefined,
            startedAt: execution.startedAt,
            stoppedAt: execution.stoppedAt,
            status: execution.status,
            storedAt: execution.storedAt,
        };
        await lifecycleHooks.runHook('workflowExecuteAfter', [run]);
    }
    async getAutodeactivationRecipient(workflow) {
        const project = await this.ownershipService.getWorkflowProjectCached(workflow.id);
        const roleSlug = project.type === 'team' ? permissions_1.PROJECT_ADMIN_ROLE_SLUG : permissions_1.PROJECT_OWNER_ROLE_SLUG;
        const projectRelations = await this.projectRelationRepository.find({
            where: {
                projectId: project.id,
                role: { slug: roleSlug },
            },
            relations: { user: true },
        });
        if (projectRelations.length > 0) {
            return projectRelations[0].user;
        }
        else {
            return await this.ownershipService.getInstanceOwner();
        }
    }
};
exports.ExecutionRecoveryService = ExecutionRecoveryService;
exports.ExecutionRecoveryService = ExecutionRecoveryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, push_1.Push, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, config_1.ExecutionsConfig, db_1.WorkflowRepository, user_management_mailer_1.UserManagementMailer, ownership_service_1.OwnershipService, db_1.ProjectRelationRepository, workflow_push_notifier_service_1.WorkflowPushNotifier, execution_crash_service_1.ExecutionCrashService])
], ExecutionRecoveryService);
//# sourceMappingURL=execution-recovery.service.js.map