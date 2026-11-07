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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerExecutionContextFactory = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_async_hooks_1 = require("node:async_hooks");
const active_executions_1 = require("../../active-executions");
const duplicate_execution_error_1 = require("../../errors/duplicate-execution.error");
const execute_error_workflow_1 = require("../../execution-lifecycle/execute-error-workflow");
const execution_service_1 = require("../../executions/execution.service");
const node_types_1 = require("../../node-types");
const schedule_trigger_job_registrar_1 = require("../../scheduling/schedule-trigger-node/schedule-trigger-job-registrar");
const ownership_service_1 = require("../../services/ownership.service");
const WorkflowExecuteAdditionalData = __importStar(require("../../workflow-execute-additional-data"));
const engine_v2_active_triggers_1 = require("../../workflows/triggers/engine-v2-active-triggers");
const poll_cursor_service_1 = require("../../workflows/triggers/poll-cursor.service");
const utils_1 = require("../../workflows/utils");
const workflow_execution_service_1 = require("../../workflows/workflow-execution.service");
const workflow_publisher_service_1 = require("../../workflows/workflow-publisher.service");
const workflow_static_data_service_1 = require("../../workflows/workflow-static-data.service");
function awaitedByTrigger(responsePromise, donePromise) {
    if (donePromise)
        return 'completion';
    if (responsePromise)
        return 'response';
    return 'none';
}
let TriggerExecutionContextFactory = class TriggerExecutionContextFactory {
    constructor(logger, errorReporter, activeExecutions, eventService, executionService, workflowStaticDataService, workflowExecutionService, storageConfig, workflowPublishedDataService, scheduleTriggerJobRegistrar, ownershipService, nodeTypes, pollCursorService, engineV2ActiveTriggers, workflowPublisherService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.activeExecutions = activeExecutions;
        this.eventService = eventService;
        this.executionService = executionService;
        this.workflowStaticDataService = workflowStaticDataService;
        this.workflowExecutionService = workflowExecutionService;
        this.storageConfig = storageConfig;
        this.workflowPublishedDataService = workflowPublishedDataService;
        this.scheduleTriggerJobRegistrar = scheduleTriggerJobRegistrar;
        this.ownershipService = ownershipService;
        this.nodeTypes = nodeTypes;
        this.pollCursorService = pollCursorService;
        this.engineV2ActiveTriggers = engineV2ActiveTriggers;
        this.workflowPublisherService = workflowPublisherService;
        this.logger = this.logger.scoped(['workflow-activation']);
    }
    settleDonePromise(executePromise, donePromise) {
        void executePromise
            .then(async (executionId) => executionId === undefined
            ? undefined
            : await this.activeExecutions.getPostExecutePromise(executionId))
            .then(donePromise.resolve, (error) => donePromise.reject((0, ensure_error_1.ensureError)(error)));
    }
    assertEngineV2Supported(data, emit) {
        try {
            this.engineV2ActiveTriggers.assertSupported(emit, data);
        }
        catch (error) {
            emit.responsePromise?.reject((0, ensure_error_1.ensureError)(error));
            throw error;
        }
    }
    logTriggerExecutionFailure(error, workflowData, node) {
        const failure = (0, ensure_error_1.ensureError)(error);
        this.logger.error(failure.message, {
            error: failure,
            workflowId: workflowData.id,
            nodeName: node.name,
        });
    }
    recordTriggerFailure(error, node, workflowData, workflow, mode) {
        void this.executionService
            .createErrorExecution(error, node, workflowData, workflow, mode)
            .then(() => {
            this.executeErrorWorkflow(error, workflowData, mode);
        })
            .catch((cause) => {
            const failure = (0, ensure_error_1.ensureError)(cause);
            this.errorReporter.error(failure);
            this.logger.error('Failed to record failed trigger execution', {
                error: failure,
                workflowId: workflowData.id,
                nodeName: node.name,
            });
        });
    }
    getExecuteTriggerFunctions(workflowData, additionalData, mode, activation, resolveWorkflowData, onTriggerFailure, scheduleCollectionSession) {
        return (workflow, node) => {
            const emit = (data, responsePromise, donePromise, deduplicationKey) => {
                this.logger.debug(`Received trigger for workflow "${workflow.name}"`);
                void this.workflowStaticDataService.saveStaticData(workflow);
                const executePromise = resolveWorkflowData()
                    .then(async (freshWorkflowData) => {
                    if (this.engineV2ActiveTriggers.handles(freshWorkflowData, mode)) {
                        this.assertEngineV2Supported(data, { responsePromise, donePromise });
                    }
                    return await this.workflowExecutionService.runWorkflow(freshWorkflowData, node, data, await this.attributeToPublisher(additionalData, freshWorkflowData), mode, responsePromise, deduplicationKey, awaitedByTrigger(responsePromise, donePromise));
                })
                    .catch((error) => {
                    if (error instanceof duplicate_execution_error_1.DuplicateExecutionError) {
                        const context = {
                            workflowId: workflowData.id,
                            nodeId: node.id,
                            deduplicationKey: error.deduplicationKey,
                        };
                        this.logger.warn('Scheduled execution skipped: duplicate deduplication key', context);
                        this.errorReporter.warn(error, { extra: context, shouldBeLogged: false });
                        return undefined;
                    }
                    throw error;
                });
                if (donePromise)
                    this.settleDonePromise(executePromise, donePromise);
                void executePromise
                    .then(async (executionId) => {
                    if (executionId === undefined)
                        return;
                    const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, workflowData.id);
                    this.eventService.emit('workflow-executed', {
                        workflowId: workflowData.id,
                        workflowName: workflowData.name,
                        executionId,
                        projectId,
                        projectName,
                        source: 'trigger',
                    });
                })
                    .catch((error) => this.logTriggerExecutionFailure(error, workflowData, node));
            };
            const emitError = (error) => {
                onTriggerFailure({ error, node, workflowData, mode, activation });
            };
            const saveFailedExecution = (error) => {
                this.logger.info(`The trigger node "${node.name}" of workflow "${workflowData.name}" reported the error: "${error.message}". Saving to failed executions`, {
                    nodeName: node.name,
                    workflowId: workflowData.id,
                    workflowName: workflowData.name,
                });
                this.recordTriggerFailure(error, node, workflowData, workflow, mode);
            };
            const schedulingFunctions = this.scheduleTriggerJobRegistrar.interceptsNode(node)
                ? scheduleCollectionSession.createCollector(workflow, node)
                : undefined;
            return new n8n_core_1.TriggerContext(workflow, node, additionalData, mode, activation, emit, emitError, saveFailedExecution, schedulingFunctions);
        };
    }
    getExecutePollFunctions(workflowData, additionalData, mode, activation, resolveWorkflowData, leasedPoll, prefetchedCursor) {
        const fence = leasedPoll?.fence;
        return (workflow, node) => {
            const ceilingMs = (leasedPoll?.timeoutSeconds ?? 0) * constants_1.Time.seconds.toMilliseconds;
            const marginMs = Math.min(Math.max(0.2 * ceilingMs, 5_000), ceilingMs / 2);
            const pollBudgetMs = () => Math.max(0, (leasedPoll?.remainingMs() ?? 0) - marginMs);
            const stagedCursorStore = new node_async_hooks_1.AsyncLocalStorage();
            const __runPoll = async (poll) => {
                const resolved = await this.pollCursorService.resolveCursor(workflowData.id, node.id, workflow.getStaticData('node', node), prefetchedCursor);
                const store = resolved.migrated
                    ? { migrated: true, snapshot: (0, cloneDeep_1.default)(resolved.cursor), seed: resolved.cursor }
                    : { migrated: false };
                return await stagedCursorStore.run(store, poll);
            };
            const takeStagedCursor = () => {
                const staged = stagedCursorStore.getStore();
                if (staged === undefined || !staged.migrated || (0, isEqual_1.default)(staged.snapshot, staged.seed)) {
                    return null;
                }
                const cursor = (0, cloneDeep_1.default)(staged.snapshot);
                staged.seed = cursor;
                return cursor;
            };
            const __emit = (data, responsePromise, donePromise) => {
                this.logger.debug(`Received event to trigger execution for workflow "${workflow.name}"`);
                const cursor = takeStagedCursor();
                void this.workflowStaticDataService.saveStaticData(workflow);
                const executePromise = resolveWorkflowData().then(async (freshWorkflowData) => {
                    const routesToV2 = this.engineV2ActiveTriggers.handles(freshWorkflowData, mode);
                    const runAdditionalData = await this.attributeToPublisher(additionalData, freshWorkflowData);
                    if (cursor === null) {
                        return await this.workflowExecutionService.runWorkflow(freshWorkflowData, node, data, runAdditionalData, mode, responsePromise, undefined, awaitedByTrigger(responsePromise, donePromise));
                    }
                    return routesToV2
                        ? await this.workflowExecutionService.runPolledWorkflowV2(freshWorkflowData, node, data, runAdditionalData, mode, cursor, responsePromise, fence)
                        : await this.workflowExecutionService.runPolledWorkflow(freshWorkflowData, node, data, runAdditionalData, mode, cursor, responsePromise, fence, awaitedByTrigger(responsePromise, donePromise));
                });
                if (donePromise)
                    this.settleDonePromise(executePromise, donePromise);
                void executePromise.catch((error) => this.logTriggerExecutionFailure(error, workflowData, node));
            };
            const __emitError = (error) => {
                this.recordTriggerFailure(error, node, workflowData, workflow, mode);
            };
            const __commitCursor = async () => {
                const cursor = takeStagedCursor();
                if (cursor === null)
                    return;
                const committed = await this.pollCursorService.commitCursorOnly({
                    workflowId: workflowData.id,
                    nodeId: node.id,
                    cursor,
                    fence,
                });
                if (!committed) {
                    this.logger.debug(`Poll node "${node.name}" cursor-only commit skipped: the poll no longer holds its lease`, { workflowId: workflowData.id, nodeId: node.id, nodeName: node.name });
                }
            };
            const resolveNodeStaticData = () => {
                const staged = stagedCursorStore.getStore();
                if (staged === undefined) {
                    throw new n8n_workflow_1.UnexpectedError('Poll node read its static data outside of a poll; __runPoll was not entered', { extra: { workflowId: workflowData.id, nodeId: node.id, nodeName: node.name } });
                }
                return staged.migrated ? staged.snapshot : workflow.getStaticData('node', node);
            };
            return new n8n_core_1.PollContext(workflow, node, additionalData, mode, activation, __emit, __emitError, __commitCursor, __runPoll, resolveNodeStaticData, fence ? pollBudgetMs : undefined);
        };
    }
    async createPollExecutionContext(workflowData, node, leasedPoll, prefetchedCursor) {
        const workflow = new n8n_workflow_1.Workflow({
            id: workflowData.id,
            name: workflowData.name,
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            active: true,
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings,
        });
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            workflowId: workflowData.id,
            workflowSettings: workflowData.settings,
        });
        const resolveWorkflowData = async () => await this.loadPublishedWorkflowData(workflowData.id, { bypassCache: true });
        const getPollFunctions = this.getExecutePollFunctions(workflowData, additionalData, 'trigger', 'update', resolveWorkflowData, leasedPoll, prefetchedCursor);
        const pollFunctions = getPollFunctions(workflow, node, additionalData, 'trigger', 'update');
        return { workflow, pollFunctions };
    }
    async attributeToPublisher(additionalData, workflowData) {
        return {
            ...additionalData,
            userId: await this.workflowPublisherService.findPublisherUserId(workflowData.id, workflowData.versionId),
        };
    }
    executeErrorWorkflow(error, workflowData, mode) {
        const fullRunData = {
            data: (0, n8n_workflow_1.createRunExecutionData)({
                resultData: {
                    error,
                    runData: {},
                },
            }),
            finished: false,
            mode,
            startedAt: new Date(),
            stoppedAt: new Date(),
            status: 'running',
            storedAt: this.storageConfig.modeTag,
        };
        (0, execute_error_workflow_1.executeErrorWorkflow)(workflowData, fullRunData, mode);
    }
    async findPublishedWorkflowData(workflowId, { bypassCache = false } = {}) {
        return bypassCache
            ? await this.workflowPublishedDataService.getPublishedWorkflowDataForExecution(workflowId)
            : await this.workflowPublishedDataService.getCachedPublishedWorkflowDataForExecution(workflowId);
    }
    async loadPublishedWorkflowData(workflowId, options = {}) {
        const publishedData = await this.findPublishedWorkflowData(workflowId, options);
        if (!publishedData) {
            throw new n8n_workflow_1.UnexpectedError('Published version not found for workflow', {
                extra: { workflowId },
            });
        }
        return publishedData;
    }
};
exports.TriggerExecutionContextFactory = TriggerExecutionContextFactory;
exports.TriggerExecutionContextFactory = TriggerExecutionContextFactory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, active_executions_1.ActiveExecutions, backend_services_1.EventService, execution_service_1.ExecutionService, workflow_static_data_service_1.WorkflowStaticDataService, workflow_execution_service_1.WorkflowExecutionService, n8n_core_1.StorageConfig, backend_services_1.WorkflowPublishedDataService, schedule_trigger_job_registrar_1.ScheduleTriggerJobRegistrar, ownership_service_1.OwnershipService, node_types_1.NodeTypes, poll_cursor_service_1.PollCursorService, engine_v2_active_triggers_1.EngineV2ActiveTriggers, workflow_publisher_service_1.WorkflowPublisherService])
], TriggerExecutionContextFactory);
//# sourceMappingURL=trigger-execution-context.factory.js.map