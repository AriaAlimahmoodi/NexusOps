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
exports.WorkflowRunner = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const p_cancelable_1 = __importDefault(require("p-cancelable"));
const active_executions_1 = require("./active-executions");
const execution_not_found_error_1 = require("./errors/execution-not-found-error");
const max_stalled_count_error_1 = require("./errors/max-stalled-count.error");
const pre_execute_blocked_error_1 = require("./errors/pre-execute-blocked.error");
const execution_lifecycle_hooks_1 = require("./execution-lifecycle/execution-lifecycle-hooks");
const to_save_settings_1 = require("./execution-lifecycle/to-save-settings");
const execution_crash_service_1 = require("./executions/execution-crash.service");
const execution_persistence_1 = require("./executions/execution-persistence");
const failed_run_factory_1 = require("./executions/failed-run-factory");
const pre_execution_checks_1 = require("./executions/pre-execution-checks");
const external_hooks_1 = require("./external-hooks");
const manual_execution_service_1 = require("./manual-execution.service");
const node_types_1 = require("./node-types");
const engine_v2_dispatcher_service_1 = require("./services/engine-v2-dispatcher.service");
const streaming_webhook_response_heartbeat_1 = require("./webhooks/streaming-webhook-response-heartbeat");
const WorkflowExecuteAdditionalData = __importStar(require("./workflow-execute-additional-data"));
const workflow_static_data_service_1 = require("./workflows/workflow-static-data.service");
const MAX_STALLED_COUNT_GRACE_WINDOW_MS = 30 * constants_1.Time.seconds.toMilliseconds;
const MAX_STALLED_COUNT_RECHECK_INTERVAL_MS = 1 * constants_1.Time.seconds.toMilliseconds;
const MAX_STALLED_COUNT_RECHECK_ATTEMPTS = Math.floor(MAX_STALLED_COUNT_GRACE_WINDOW_MS / MAX_STALLED_COUNT_RECHECK_INTERVAL_MS);
const MAX_STALLED_COUNT_RECHECK_JITTER_RATIO = 0.2;
function flushResponse(res) {
    if (typeof res.flush === 'function') {
        res.flush();
    }
}
let WorkflowRunner = class WorkflowRunner {
    constructor(logger, errorReporter, activeExecutions, executionRepository, executionPersistence, workflowStaticDataService, nodeTypes, credentialsPermissionChecker, instanceSettings, manualExecutionService, failedRunFactory, eventService, executionsConfig, storageConfig, externalHooks, engineV2Dispatcher, workflowPreExecute, executionCrashService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.activeExecutions = activeExecutions;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.workflowStaticDataService = workflowStaticDataService;
        this.nodeTypes = nodeTypes;
        this.credentialsPermissionChecker = credentialsPermissionChecker;
        this.instanceSettings = instanceSettings;
        this.manualExecutionService = manualExecutionService;
        this.failedRunFactory = failedRunFactory;
        this.eventService = eventService;
        this.executionsConfig = executionsConfig;
        this.storageConfig = storageConfig;
        this.externalHooks = externalHooks;
        this.engineV2Dispatcher = engineV2Dispatcher;
        this.workflowPreExecute = workflowPreExecute;
        this.executionCrashService = executionCrashService;
    }
    async processError(error, startedAt, executionMode, executionId, hooks, storedAt = this.storageConfig.modeTag) {
        if (error instanceof execution_not_found_error_1.ExecutionNotFoundError ||
            error instanceof n8n_workflow_1.ExecutionCancelledError ||
            (typeof error.message === 'string' && error.message.includes('cancelled'))) {
            return;
        }
        const isQueueMode = this.executionsConfig.mode === 'queue';
        if (isQueueMode) {
            const isStalled = error instanceof max_stalled_count_error_1.MaxStalledCountError;
            const rechecks = isStalled ? MAX_STALLED_COUNT_RECHECK_ATTEMPTS : 0;
            const recheckUntil = Date.now() + (isStalled ? MAX_STALLED_COUNT_GRACE_WINDOW_MS : 0);
            for (let recheck = 0; recheck <= rechecks; recheck++) {
                const executionWithoutData = await this.executionRepository.findSingleExecution(executionId, { includeData: false });
                const status = executionWithoutData?.status;
                if (status === 'success' || status === 'waiting') {
                    let storedRunData;
                    try {
                        const fullExecutionData = await this.executionPersistence.findSingleExecution(executionId, {
                            includeData: true,
                            unflattenData: true,
                        });
                        if (fullExecutionData?.data) {
                            storedRunData = {
                                finished: fullExecutionData.finished,
                                mode: fullExecutionData.mode,
                                startedAt: fullExecutionData.startedAt,
                                stoppedAt: fullExecutionData.stoppedAt,
                                status: fullExecutionData.status,
                                waitTill: fullExecutionData.waitTill,
                                data: fullExecutionData.data,
                                storedAt: fullExecutionData.storedAt,
                            };
                        }
                        if (fullExecutionData && status === 'success') {
                            try {
                                const saveSettings = (0, to_save_settings_1.toSaveSettings)(fullExecutionData.workflowData?.settings);
                                const isManualExecution = fullExecutionData.mode === 'manual';
                                if (isManualExecution && !saveSettings.manual) {
                                    await this.executionRepository.softDelete(executionId);
                                }
                                else if (!isManualExecution && !saveSettings.success) {
                                    await this.executionPersistence.deleteInFlightExecution({
                                        workflowId: fullExecutionData.workflowId,
                                        executionId,
                                        storedAt: fullExecutionData.storedAt,
                                    });
                                }
                            }
                            catch (pruneError) {
                                this.logger.warn('Could not prune a recovered false-positive success', {
                                    executionId,
                                    error: (0, ensure_error_1.ensureError)(pruneError),
                                });
                            }
                        }
                    }
                    catch (readError) {
                        this.logger.warn('Could not read execution data for a recovered execution', {
                            executionId,
                            error: (0, ensure_error_1.ensureError)(readError),
                        });
                    }
                    const unreadableRunData = status === 'waiting'
                        ? {
                            data: (0, n8n_workflow_1.createRunExecutionData)({ resultData: { runData: {} } }),
                            finished: false,
                            mode: executionMode,
                            startedAt,
                            stoppedAt: new Date(),
                            status: 'waiting',
                            waitTill: executionWithoutData?.waitTill ?? undefined,
                            storedAt: this.storageConfig.modeTag,
                        }
                        : {
                            data: (0, n8n_workflow_1.createRunExecutionData)({
                                resultData: {
                                    error: new n8n_workflow_1.WorkflowOperationError(`Execution ${executionId} succeeded, but its result could not be read`),
                                    runData: {},
                                },
                            }),
                            finished: false,
                            mode: executionMode,
                            startedAt,
                            stoppedAt: new Date(),
                            status: 'error',
                            storedAt: this.storageConfig.modeTag,
                        };
                    const runData = storedRunData ?? unreadableRunData;
                    this.activeExecutions.resolveExecutionResponsePromise(executionId);
                    this.activeExecutions.finalizeExecution(executionId, runData);
                    return;
                }
                if (status === 'canceled')
                    return;
                if (status === undefined || (0, n8n_workflow_1.isTerminalExecutionStatus)(status))
                    break;
                if (recheck >= rechecks || Date.now() >= recheckUntil)
                    break;
                const jitter = MAX_STALLED_COUNT_RECHECK_INTERVAL_MS *
                    MAX_STALLED_COUNT_RECHECK_JITTER_RATIO *
                    (2 * Math.random() - 1);
                await (0, sleep_1.sleep)(MAX_STALLED_COUNT_RECHECK_INTERVAL_MS + jitter);
            }
        }
        this.logger.error(`Problem with execution ${executionId}: ${error.message}. Aborting.`);
        this.errorReporter.error(error, { executionId });
        if (error instanceof max_stalled_count_error_1.MaxStalledCountError) {
            const claimed = await this.executionCrashService.markAsCrashedWithoutCounting(executionId, 'stall');
            if (claimed.length === 0) {
                this.activeExecutions.finalizeExecution(executionId);
                return;
            }
        }
        const fullRunData = {
            data: (0, n8n_workflow_1.createRunExecutionData)({
                resultData: {
                    error: {
                        ...error,
                        name: error.constructor.name,
                        message: error.message,
                        stack: error.stack,
                    },
                    runData: {},
                },
            }),
            finished: false,
            mode: executionMode,
            startedAt,
            stoppedAt: new Date(),
            status: error instanceof max_stalled_count_error_1.MaxStalledCountError ? 'crashed' : 'error',
            storedAt,
        };
        this.activeExecutions.finalizeExecution(executionId, fullRunData);
        await hooks?.runHook('workflowExecuteAfter', [fullRunData]);
    }
    async failExecution(data, executionId, error, responsePromise) {
        const runData = this.failedRunFactory.generateFailedExecutionFromError(data.executionMode, error, error.node);
        const lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForRegularMain)(data, executionId);
        await lifecycleHooks.runHook('workflowExecuteBefore', [undefined, data.executionData]);
        await lifecycleHooks.runHook('workflowExecuteAfter', [runData]);
        responsePromise?.reject(error);
        this.activeExecutions.finalizeExecution(executionId);
    }
    async establishContextForPersistence(data) {
        let establishContextError;
        if (data.executionData?.executionData) {
            const contextWorkflow = new n8n_workflow_1.Workflow({
                id: data.workflowData.id,
                name: data.workflowData.name,
                nodes: data.workflowData.nodes,
                connections: data.workflowData.connections,
                active: data.workflowData.activeVersionId !== null,
                nodeTypes: this.nodeTypes,
                staticData: data.workflowData.staticData,
                settings: data.workflowData.settings ?? {},
            });
            try {
                await (0, n8n_core_1.establishExecutionContext)(contextWorkflow, data.executionData, { encryptedRunnerIdentity: data.encryptedRunnerIdentity }, data.executionMode);
            }
            catch (error) {
                data.executionData.executionData.nodeExecutionStack = [];
                establishContextError = error;
            }
        }
        return establishContextError;
    }
    async run(data, loadStaticData, realtime, existingExecution, responsePromise) {
        if (this.engineV2Dispatcher.routesToEngineV2(data, existingExecution)) {
            return await this.engineV2Dispatcher.start(data);
        }
        const establishContextError = await this.establishContextForPersistence(data);
        if (!establishContextError) {
            try {
                await this.credentialsPermissionChecker.check(data.workflowData.id, data.workflowData.nodes, data.userId);
            }
            catch (error) {
                const executionId = await this.activeExecutions.add(data, existingExecution);
                await this.failExecution(data, executionId, error, responsePromise);
                return executionId;
            }
        }
        let executionWorkflow;
        if (!existingExecution && !establishContextError) {
            try {
                executionWorkflow = await this.prepareNewExecution(data, loadStaticData);
            }
            catch (error) {
                throw pre_execute_blocked_error_1.PreExecuteBlockedError.unwrap(error);
            }
        }
        const executionId = await this.activeExecutions.add(data, existingExecution);
        if (establishContextError) {
            await this.failExecution(data, executionId, establishContextError, responsePromise);
            return executionId;
        }
        const { id: workflowId } = data.workflowData;
        if (responsePromise) {
            this.activeExecutions.attachResponsePromise(executionId, responsePromise);
        }
        const heartbeat = this.setupV1StreamingHeartbeat(data);
        const shouldEnqueue = process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS === 'true'
            ? this.executionsConfig.mode === 'queue'
            : this.executionsConfig.mode === 'queue' && data.executionMode !== 'manual';
        const shouldReloadStaticData = Boolean(existingExecution && loadStaticData);
        try {
            if (shouldEnqueue) {
                await this.enqueueExecution(executionId, workflowId, data, loadStaticData, realtime, existingExecution?.executionId);
            }
            else {
                await this.runMainProcess(executionId, data, shouldReloadStaticData, existingExecution, executionWorkflow);
            }
        }
        catch (error) {
            heartbeat?.stop();
            throw error;
        }
        if (this.executionsConfig.mode !== 'queue' ||
            this.instanceSettings.instanceType === 'worker' ||
            data.executionMode === 'manual' ||
            data.executionMode === 'chat') {
            const postExecutePromise = this.activeExecutions.getPostExecutePromise(executionId);
            postExecutePromise.catch((error) => {
                if (error instanceof n8n_workflow_1.ExecutionCancelledError)
                    return;
                this.errorReporter.error(error, {
                    extra: { executionId, workflowId },
                });
                this.logger.error('There was an error in the post-execution promise', {
                    error,
                    executionId,
                    workflowId,
                    workflowName: data.workflowData.name,
                    ...(data.projectId && { projectId: data.projectId }),
                    ...(data.projectName && { projectName: data.projectName }),
                });
            });
        }
        if (heartbeat) {
            const postExecutePromise = this.activeExecutions.getPostExecutePromise(executionId);
            void postExecutePromise.finally(() => {
                heartbeat.stop();
            });
        }
        return executionId;
    }
    setupV1StreamingHeartbeat(data) {
        if (data.streamingEnabled !== true || !data.httpResponse)
            return undefined;
        return new streaming_webhook_response_heartbeat_1.StreamingWebhookResponseHeartbeat(data.httpResponse);
    }
    resolvePinData(data) {
        if (['manual', 'evaluation'].includes(data.executionMode)) {
            return data.pinData ?? data.workflowData.pinData;
        }
        return undefined;
    }
    async prepareNewExecution(data, loadStaticData) {
        if (loadStaticData === true && data.workflowData.id) {
            data.workflowData.staticData = await this.workflowStaticDataService.getStaticDataById(data.workflowData.id);
        }
        return await this.workflowPreExecute.run(data.workflowData, data.executionMode, data.source, this.resolvePinData(data));
    }
    async runMainProcess(executionId, data, loadStaticData, existingExecution, executionWorkflow) {
        const workflowId = data.workflowData.id;
        if (loadStaticData === true && workflowId) {
            data.workflowData.staticData =
                await this.workflowStaticDataService.getStaticDataById(workflowId);
        }
        let executionTimeout;
        const workflowSettings = data.workflowData.settings ?? {};
        let workflowTimeout = workflowSettings.executionTimeout ?? this.executionsConfig.timeout;
        if (workflowTimeout > 0) {
            workflowTimeout = Math.min(workflowTimeout, this.executionsConfig.maxTimeout);
        }
        const pinData = this.resolvePinData(data);
        const workflow = executionWorkflow ??
            new n8n_workflow_1.Workflow({
                id: workflowId,
                name: data.workflowData.name,
                nodes: data.workflowData.nodes,
                connections: data.workflowData.connections,
                active: data.workflowData.activeVersionId !== null,
                nodeTypes: this.nodeTypes,
                staticData: data.workflowData.staticData,
                settings: workflowSettings,
                pinData,
            });
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            userId: data.userId,
            workflowId: workflow.id,
            executionTimeoutTimestamp: workflowTimeout <= 0 ? undefined : Date.now() + workflowTimeout * 1000,
            workflowSettings,
        });
        additionalData.restartExecutionId = existingExecution?.executionId;
        additionalData.streamingEnabled = data.streamingEnabled;
        additionalData.encryptedRunnerIdentity = data.encryptedRunnerIdentity;
        additionalData.executionId = executionId;
        additionalData.evaluationRunId = data.evaluationRunId;
        const storedAt = existingExecution?.storedAt ?? this.storageConfig.modeTag;
        this.logger.debug(`Execution for workflow ${data.workflowData.name} was assigned id ${executionId}`, { executionId });
        let workflowExecution;
        await this.executionRepository.setRunning(executionId);
        try {
            const lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForRegularMain)(data, executionId);
            additionalData.hooks = lifecycleHooks;
            lifecycleHooks.addHandler('sendResponse', (response) => {
                this.activeExecutions.resolveResponsePromise(executionId, response);
            });
            if (data.streamingEnabled) {
                lifecycleHooks.addHandler('sendChunk', (chunk) => {
                    data.httpResponse?.write(JSON.stringify(chunk) + '\n');
                    if (data.httpResponse)
                        flushResponse(data.httpResponse);
                });
            }
            additionalData.setExecutionStatus = WorkflowExecuteAdditionalData.setExecutionStatus.bind({
                executionId,
            });
            additionalData.sendDataToUI = WorkflowExecuteAdditionalData.sendDataToUI.bind({
                pushRef: data.pushRef,
            });
            if (data.configureAdditionalData) {
                await data.configureAdditionalData(additionalData);
            }
            if (data.executionData !== undefined) {
                this.logger.debug(`Execution ID ${executionId} had Execution data. Running with payload.`, {
                    executionId,
                });
                const workflowExecute = new n8n_core_1.WorkflowExecute(additionalData, data.executionMode, data.executionData, storedAt);
                workflowExecution = workflowExecute.processRunExecutionData(workflow);
            }
            else {
                workflowExecution = this.manualExecutionService.runManually(data, workflow, additionalData, executionId, pinData);
            }
            this.activeExecutions.attachWorkflowExecution(executionId, workflowExecution);
            if (workflowTimeout > 0) {
                let timeout = Math.min(workflowTimeout, this.executionsConfig.maxTimeout) * 1000;
                if (data.startedAt && data.startedAt instanceof Date) {
                    const now = Date.now();
                    timeout = Math.max(timeout - (now - data.startedAt.getTime()), 0);
                }
                if (timeout === 0) {
                    this.activeExecutions.stopExecution(executionId, new n8n_workflow_1.TimeoutExecutionCancelledError(executionId));
                }
                else {
                    executionTimeout = setTimeout(() => {
                        void this.activeExecutions.stopExecution(executionId, new n8n_workflow_1.TimeoutExecutionCancelledError(executionId));
                    }, timeout);
                }
            }
            workflowExecution
                .then((fullRunData) => {
                clearTimeout(executionTimeout);
                if (workflowExecution.isCanceled) {
                    fullRunData.finished = false;
                }
                this.activeExecutions.resolveExecutionResponsePromise(executionId);
                this.activeExecutions.finalizeExecution(executionId, fullRunData);
            })
                .catch(async (error) => await this.processError(error, new Date(), data.executionMode, executionId, additionalData.hooks, storedAt));
        }
        catch (error) {
            await this.processError(error, new Date(), data.executionMode, executionId, additionalData.hooks, storedAt);
            throw error;
        }
    }
    async enqueueExecution(executionId, workflowId, data, loadStaticData, realtime, restartExecutionId) {
        if (!this.scalingService) {
            const { ScalingService } = await import('./scaling/scaling.service.js');
            this.scalingService = di_1.Container.get(ScalingService);
            await this.scalingService.setupQueue();
        }
        if (!this.poolConfigService) {
            const { PoolConfigService } = await import('./scaling/pool-config.service.ee.js');
            this.poolConfigService = di_1.Container.get(PoolConfigService);
        }
        let job;
        let lifecycleHooks;
        try {
            const { queueName, poolName } = await this.poolConfigService.resolvePoolForExecution(data);
            const jobData = {
                workflowId,
                executionId,
                loadStaticData: !!loadStaticData,
                pushRef: data.pushRef,
                streamingEnabled: data.streamingEnabled,
                callerAwaitsOutcome: data.callerAwaitsOutcome,
                restartExecutionId,
                projectId: data.projectId,
                projectName: data.projectName,
                encryptedRunnerIdentity: data.encryptedRunnerIdentity,
                poolName,
                isMcpExecution: data.isMcpExecution,
                mcpType: data.mcpType,
                mcpSessionId: data.mcpSessionId,
                mcpMessageId: data.mcpMessageId,
                mcpToolCall: data.mcpToolCall,
                mcpToolInput: data.mcpToolInput,
            };
            job = await this.scalingService.addJob(jobData, { priority: realtime ? 50 : 100, queueName });
            lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForScalingMain)(data, executionId);
            await lifecycleHooks.runHook('workflowExecuteBefore', [undefined, data.executionData]);
        }
        catch (error) {
            const lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForScalingWorker)(data, executionId);
            await this.processError(error, new Date(), data.executionMode, executionId, lifecycleHooks);
            if (job)
                this.scalingService.popJobResult(job);
            throw error;
        }
        const workflowExecution = new p_cancelable_1.default(async (resolve, reject, onCancel) => {
            onCancel.shouldReject = false;
            onCancel(async () => {
                await this.scalingService.stopJob(job);
                const lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForScalingWorker)(data, executionId);
                const error = new n8n_workflow_1.ManualExecutionCancelledError(executionId);
                await this.processError(error, new Date(), data.executionMode, executionId, lifecycleHooks);
                reject(error);
            });
            try {
                await this.scalingService.waitForJob(job);
            }
            catch (error) {
                if (error instanceof Error &&
                    typeof error.message === 'string' &&
                    error.message.includes('job stalled more than maxStalledCount')) {
                    error = new max_stalled_count_error_1.MaxStalledCountError(error);
                    this.eventService.emit('job-stalled', {
                        executionId: job.data.executionId,
                        workflowId: job.data.workflowId,
                        hostId: this.instanceSettings.hostId,
                        jobId: job.id.toString(),
                    });
                }
                const lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForScalingWorker)(data, executionId);
                await this.processError(error, new Date(), data.executionMode, executionId, lifecycleHooks);
                this.scalingService.popJobResult(job);
                return reject(error);
            }
            const jobResult = this.scalingService.popJobResult(job);
            let runData;
            if (!jobResult ||
                this.needsFullExecutionData(data.executionMode, executionId, data.forceFullExecutionData)) {
                let fullExecutionData;
                try {
                    fullExecutionData = await this.executionPersistence.findSingleExecution(executionId, {
                        includeData: true,
                        unflattenData: true,
                    });
                }
                catch (error) {
                    await this.processError(error, new Date(), data.executionMode, executionId, (0, execution_lifecycle_hooks_1.getLifecycleHooksForScalingWorker)(data, executionId));
                    return reject(error);
                }
                if (!fullExecutionData) {
                    this.logger.warn(`Execution ${executionId} ended but its record is gone`, {
                        executionId,
                    });
                    const error = new n8n_workflow_1.WorkflowOperationError(`Could not find execution with id "${executionId}"`);
                    await this.processError(error, new Date(), data.executionMode, executionId, (0, execution_lifecycle_hooks_1.getLifecycleHooksForScalingWorker)(data, executionId));
                    return reject(error);
                }
                runData = {
                    finished: fullExecutionData.finished,
                    mode: fullExecutionData.mode,
                    startedAt: fullExecutionData.startedAt,
                    stoppedAt: fullExecutionData.stoppedAt,
                    status: jobResult ? jobResult.status : fullExecutionData.status,
                    waitTill: jobResult ? jobResult.waitTill : fullExecutionData.waitTill,
                    data: fullExecutionData.data,
                    jobId: job.id.toString(),
                    storedAt: fullExecutionData.storedAt,
                    nodeTimeSavedMinutes: jobResult?.nodeTimeSavedMinutes,
                };
            }
            else {
                runData = {
                    finished: jobResult.success,
                    mode: data.executionMode,
                    startedAt: jobResult.startedAt,
                    stoppedAt: jobResult.stoppedAt,
                    status: jobResult.status,
                    waitTill: jobResult.waitTill,
                    data: (0, n8n_workflow_1.createRunExecutionData)({
                        resultData: {
                            runData: {},
                            lastNodeExecuted: jobResult.lastNodeExecuted,
                            error: jobResult.error,
                            metadata: jobResult.metadata,
                        },
                    }),
                    jobId: job.id.toString(),
                    storedAt: this.storageConfig.modeTag,
                    nodeTimeSavedMinutes: jobResult.nodeTimeSavedMinutes,
                };
            }
            this.activeExecutions.finalizeExecution(executionId, runData);
            await lifecycleHooks.runHook('workflowExecuteAfter', [runData]);
            resolve(runData);
        });
        workflowExecution.catch(() => {
        });
        this.activeExecutions.attachWorkflowExecution(executionId, workflowExecution, {
            isQueueJob: true,
        });
    }
    needsFullExecutionData(executionMode, executionId, forceFullExecutionData) {
        if (forceFullExecutionData)
            return true;
        return (executionMode === 'integrated' ||
            this.activeExecutions.getResponseMode(executionId) === 'lastNode' ||
            this.externalHooks.hasHook('workflow.postExecute'));
    }
};
exports.WorkflowRunner = WorkflowRunner;
exports.WorkflowRunner = WorkflowRunner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, active_executions_1.ActiveExecutions, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, workflow_static_data_service_1.WorkflowStaticDataService, node_types_1.NodeTypes, pre_execution_checks_1.CredentialsPermissionChecker, n8n_core_1.InstanceSettings, manual_execution_service_1.ManualExecutionService, failed_run_factory_1.FailedRunFactory, backend_services_1.EventService, config_1.ExecutionsConfig, n8n_core_1.StorageConfig, external_hooks_1.ExternalHooks, engine_v2_dispatcher_service_1.EngineV2Dispatcher, pre_execution_checks_1.WorkflowPreExecute, execution_crash_service_1.ExecutionCrashService])
], WorkflowRunner);
//# sourceMappingURL=workflow-runner.js.map