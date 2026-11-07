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
exports.JobProcessor = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const execution_lifecycle_hooks_1 = require("../execution-lifecycle/execution-lifecycle-hooks");
const shared_hook_functions_1 = require("../execution-lifecycle/shared/shared-hook-functions");
const execution_persistence_1 = require("../executions/execution-persistence");
const execution_utils_1 = require("../executions/execution.utils");
const manual_execution_service_1 = require("../manual-execution.service");
const node_types_1 = require("../node-types");
const utils_1 = require("../utils");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const webhook_response_relay_1 = require("./webhook-response-relay");
function isInvokableTool(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'invoke' in value &&
        typeof value.invoke === 'function');
}
function scheduleAt(timestamp, fn) {
    let timer;
    const schedule = () => {
        const delay = Math.max(timestamp - Date.now(), 0);
        timer =
            delay > constants_1.MAX_INTEGER_32BITS_SIGNED
                ? setTimeout(schedule, constants_1.MAX_INTEGER_32BITS_SIGNED)
                : setTimeout(fn, delay);
        timer.unref();
    };
    schedule();
    return () => clearTimeout(timer);
}
const SUSPENDABLE_EXECUTION_MODES = new Set(['webhook', 'trigger', 'retry']);
let JobProcessor = class JobProcessor {
    constructor(logger, executionRepository, executionPersistence, workflowRepository, nodeTypes, instanceSettings, manualExecutionService, executionsConfig, eventService, webhookResponseRelay) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.workflowRepository = workflowRepository;
        this.nodeTypes = nodeTypes;
        this.instanceSettings = instanceSettings;
        this.manualExecutionService = manualExecutionService;
        this.executionsConfig = executionsConfig;
        this.eventService = eventService;
        this.webhookResponseRelay = webhookResponseRelay;
        this.runningJobs = {};
        this.trackedJobs = new Map();
        this.cancellationReasons = {};
        this.suspensionRequested = false;
        this.logger = this.logger.scoped('scaling');
    }
    async processJob(job) {
        this.trackedJobs.set(String(job.id), job.data.executionId);
        try {
            return await this.runJob(job);
        }
        finally {
            this.trackedJobs.delete(String(job.id));
        }
    }
    async runJob(job) {
        const { executionId, loadStaticData } = job.data;
        const execution = await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        if (!execution) {
            throw new n8n_workflow_1.UnexpectedError(`Worker failed to find data for execution ${executionId} (job ${job.id})`);
        }
        if (execution.status === 'crashed')
            return { success: false };
        if (!execution.data) {
            throw new n8n_workflow_1.UnexpectedError(`Worker received execution ${executionId} without run data (job ${job.id})`);
        }
        const workflowId = execution.workflowData.id;
        this.logger.info(`Worker started execution ${executionId} (job ${job.id})`, {
            executionId,
            workflowId,
            workflowName: execution.workflowData.name,
            jobId: job.id,
            ...(job.data.projectId !== undefined && { projectId: job.data.projectId }),
            ...(job.data.projectName !== undefined && { projectName: job.data.projectName }),
        });
        const startedAt = await this.executionRepository.setRunning(executionId);
        let { staticData } = execution.workflowData;
        if (loadStaticData) {
            const workflowData = await this.workflowRepository.findOne({
                select: ['id', 'staticData'],
                where: { id: workflowId },
            });
            if (workflowData === null) {
                throw new n8n_workflow_1.UnexpectedError(`Worker failed to find workflow ${workflowId} to run execution ${executionId} (job ${job.id})`);
            }
            staticData = workflowData.staticData;
        }
        const workflowSettings = execution.workflowData.settings ?? {};
        let workflowTimeout = workflowSettings.executionTimeout ?? this.executionsConfig.timeout;
        let executionTimeoutTimestamp;
        if (workflowTimeout > 0) {
            workflowTimeout = Math.min(workflowTimeout, this.executionsConfig.maxTimeout);
            executionTimeoutTimestamp = Date.now() + workflowTimeout * 1000;
        }
        const workflow = new n8n_workflow_1.Workflow({
            id: workflowId,
            name: execution.workflowData.name,
            nodes: execution.workflowData.nodes,
            connections: execution.workflowData.connections,
            active: (0, execution_utils_1.getWorkflowActiveStatusFromWorkflowData)(execution.workflowData),
            nodeTypes: this.nodeTypes,
            staticData,
            settings: execution.workflowData.settings,
        });
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            workflowId,
            executionTimeoutTimestamp,
            workflowSettings: execution.workflowData.settings,
        });
        additionalData.streamingEnabled = job.data.streamingEnabled;
        additionalData.restartExecutionId = job.data.restartExecutionId;
        additionalData.evaluationRunId = execution.data.manualData?.evaluationRunId;
        additionalData.encryptedRunnerIdentity = job.data.encryptedRunnerIdentity;
        const { pushRef } = job.data;
        const lifecycleHooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForScalingWorker)({
            executionMode: execution.mode,
            workflowData: execution.workflowData,
            retryOf: execution.retryOf,
            pushRef,
            userId: execution.data.manualData?.userId,
            source: execution.data.manualData?.source,
            suppressErrorWorkflow: execution.data.manualData?.suppressErrorWorkflow,
        }, executionId);
        additionalData.hooks = lifecycleHooks;
        if (pushRef) {
            additionalData.sendDataToUI = WorkflowExecuteAdditionalData.sendDataToUI.bind({
                pushRef,
            });
        }
        let callerAwaitsOutcome = job.data.callerAwaitsOutcome ?? 'completion';
        lifecycleHooks.addHandler('sendResponse', async (response) => {
            if (job.data.isMcpExecution && job.data.mcpSessionId && job.data.mcpType !== 'trigger') {
                return;
            }
            const relayed = await this.webhookResponseRelay.prepare(response, {
                workflowId: job.data.workflowId,
                executionId,
            });
            if (job.data.isMcpExecution && job.data.mcpSessionId) {
                const msg = {
                    kind: 'mcp-response',
                    executionId,
                    mcpType: 'trigger',
                    sessionId: job.data.mcpSessionId,
                    messageId: job.data.mcpMessageId ?? '',
                    response: relayed,
                    workerId: this.instanceSettings.hostId,
                };
                await job.progress(msg);
                return;
            }
            const msg = {
                kind: 'respond-to-webhook',
                executionId,
                response: relayed,
                workerId: this.instanceSettings.hostId,
            };
            await job.progress(msg);
            if (callerAwaitsOutcome !== 'response')
                return;
            callerAwaitsOutcome = 'none';
            if (this.suspensionRequested)
                this.runningJobs[job.id]?.suspend?.();
        });
        lifecycleHooks.addHandler('sendChunk', async (chunk) => {
            const msg = {
                kind: 'send-chunk',
                executionId,
                chunkText: chunk,
                workerId: this.instanceSettings.hostId,
            };
            await job.progress(msg);
        });
        additionalData.executionId = executionId;
        additionalData.setExecutionStatus = (status) => {
            this.logger.debug(`Queued worker execution status for execution ${executionId} (job ${job.id}) is "${status}"`, {
                executionId,
                workflowId,
                workflowName: execution.workflowData.name,
                jobId: job.id,
                ...(job.data.projectId && { projectId: job.data.projectId }),
                ...(job.data.projectName && { projectName: job.data.projectName }),
            });
        };
        let workflowExecute;
        let workflowRun;
        const { startData, resultData, manualData } = execution.data;
        if (execution.data?.executionData) {
            workflowExecute = new n8n_core_1.WorkflowExecute(additionalData, execution.mode, execution.data, execution.storedAt);
            workflowRun = workflowExecute.processRunExecutionData(workflow);
        }
        else {
            const data = {
                executionMode: execution.mode,
                workflowData: execution.workflowData,
                destinationNode: startData?.destinationNode,
                startNodes: startData?.startNodes,
                runData: resultData.runData,
                pinData: resultData.pinData,
                dirtyNodeNames: manualData?.dirtyNodeNames,
                triggerToStartFrom: manualData?.triggerToStartFrom,
                userId: manualData?.userId,
                agentRequest: manualData?.agentRequest,
            };
            workflowRun = this.manualExecutionService.runManually(data, workflow, additionalData, executionId, resultData.pinData, execution.storedAt);
        }
        const runningJob = {
            run: workflowRun,
            executionId,
            workflowId: execution.workflowId,
            workflowName: execution.workflowData.name,
            mode: execution.mode,
            startedAt,
            retryOf: execution.retryOf ?? undefined,
            status: execution.status,
        };
        if (workflowExecute && this.isJobSuspendable(job, execution)) {
            const suspendable = workflowExecute;
            runningJob.suspend = () => {
                if (callerAwaitsOutcome !== 'none')
                    return false;
                suspendable.suspend();
                return true;
            };
            if (this.suspensionRequested)
                runningJob.suspend();
        }
        this.runningJobs[job.id] = runningJob;
        const clearTimeoutWatchdog = executionTimeoutTimestamp !== undefined
            ? scheduleAt(executionTimeoutTimestamp, () => this.cancelJob(job.id, 'timeout'))
            : undefined;
        let run;
        let cancellationReason;
        try {
            run = await workflowRun;
        }
        finally {
            clearTimeoutWatchdog?.();
            cancellationReason = this.cancellationReasons[job.id];
            delete this.cancellationReasons[job.id];
            delete this.runningJobs[job.id];
        }
        const timedOut = cancellationReason === undefined
            ? executionTimeoutTimestamp !== undefined && Date.now() >= executionTimeoutTimestamp
            : cancellationReason === 'timeout';
        if (run?.status === 'canceled' || cancellationReason !== undefined) {
            throw timedOut
                ? new n8n_workflow_1.TimeoutExecutionCancelledError(executionId)
                : new n8n_workflow_1.ManualExecutionCancelledError(executionId);
        }
        const props = this.deriveJobFinishedProps(run, startedAt);
        this.logger.info(`Worker finished execution ${executionId} (job ${job.id})`, {
            executionId,
            workflowId,
            workflowName: execution.workflowData.name,
            jobId: job.id,
            success: props.success,
            ...(job.data.projectId && { projectId: job.data.projectId }),
            ...(job.data.projectName && { projectName: job.data.projectName }),
        });
        const msg = {
            kind: 'job-finished',
            version: 2,
            executionId,
            workerId: this.instanceSettings.hostId,
            ...props,
        };
        await job.progress(msg);
        if (job.data.isMcpExecution &&
            job.data.mcpType === 'trigger' &&
            job.data.mcpSessionId &&
            job.data.mcpToolCall?.sourceNodeName) {
            const { toolName, arguments: toolArgs, sourceNodeName } = job.data.mcpToolCall;
            let toolResult;
            try {
                toolResult = await (0, utils_1.withExpressionIsolate)(workflow, async () => await this.invokeTool({
                    workflow,
                    sourceNodeName,
                    toolName,
                    toolArgs,
                    toolInput: job.data.mcpToolInput,
                    additionalData,
                    runExecutionData: run.data,
                    executionContext: execution.data?.executionData?.runtimeData,
                }));
                this.webhookResponseRelay.assertFitsInline(toolResult);
            }
            catch (error) {
                this.logger.error('Tool call failed for MCP Trigger', {
                    executionId,
                    toolName,
                    sourceNodeName,
                    error: error instanceof Error ? error.message : String(error),
                });
                toolResult = {
                    error: error instanceof Error
                        ? { message: error.message, name: error.name }
                        : { message: String(error) },
                };
            }
            try {
                const toolRunData = run.data.resultData?.runData;
                await this.executionPersistence.updateExistingExecution(executionId, {
                    ...(0, shared_hook_functions_1.prepareExecutionDataForDbUpdate)({
                        runData: run,
                        workflowData: execution.workflowData,
                        workflowStatusFinal: run.status,
                        retryOf: execution.retryOf ?? undefined,
                    }),
                    usedPrivateCredentials: (0, n8n_workflow_1.runDataUsedDynamicCredentials)(toolRunData) ||
                        (0, n8n_workflow_1.runDataAttemptedDynamicCredentials)(toolRunData),
                }, { requireNotCanceled: true });
            }
            catch (error) {
                this.logger.error('Failed to persist tool call run data for MCP Trigger', {
                    executionId,
                    sourceNodeName,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            const mcpMsg = {
                kind: 'mcp-response',
                executionId,
                mcpType: 'trigger',
                sessionId: job.data.mcpSessionId,
                messageId: job.data.mcpMessageId ?? '',
                response: toolResult,
                workerId: this.instanceSettings.hostId,
            };
            await job.progress(mcpMsg);
        }
        else if (job.data.isMcpExecution && job.data.mcpSessionId) {
            const mcpMsg = {
                kind: 'mcp-response',
                executionId,
                mcpType: job.data.mcpType ?? 'service',
                sessionId: job.data.mcpSessionId,
                messageId: job.data.mcpMessageId ?? '',
                response: { success: props.success },
                workerId: this.instanceSettings.hostId,
            };
            await job.progress(mcpMsg);
        }
        return { success: true };
    }
    deriveJobFinishedProps(run, startedAt) {
        return {
            success: run.status !== 'error' && run.data.resultData.error === undefined,
            status: run.status,
            error: run.data.resultData.error,
            startedAt,
            stoppedAt: run.stoppedAt,
            lastNodeExecuted: run.data.resultData.lastNodeExecuted,
            usedDynamicCredentials: !!run.data.executionData?.runtimeData?.credentials,
            metadata: run.data.resultData.metadata,
            waitTill: run.waitTill ?? null,
            nodeTimeSavedMinutes: (0, backend_services_1.sumNodeTimeSavedMinutes)(run.data.resultData.runData),
        };
    }
    stopJob(jobId) {
        this.cancelJob(jobId, 'manual');
    }
    cancelJob(jobId, reason) {
        const runningJob = this.runningJobs[jobId];
        if (!runningJob)
            return;
        const { executionId, workflowId, workflowName } = runningJob;
        this.eventService.emit('execution-cancelled', {
            executionId,
            workflowId,
            workflowName,
            reason,
        });
        runningJob.run.cancel();
        delete this.runningJobs[jobId];
        this.trackedJobs.delete(String(jobId));
        this.cancellationReasons[jobId] = reason;
    }
    getTrackedJobIds() {
        return [...this.trackedJobs.keys()];
    }
    getJobsInPreflight() {
        return [...this.trackedJobs]
            .filter(([jobId]) => !(jobId in this.runningJobs))
            .map(([jobId, executionId]) => ({ jobId, executionId }));
    }
    isJobSuspendable(job, execution) {
        const hasChatTrigger = execution.workflowData.nodes.some((node) => node.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE && !node.disabled);
        return (SUSPENDABLE_EXECUTION_MODES.has(execution.mode) &&
            !job.data.streamingEnabled &&
            !job.data.isMcpExecution &&
            !hasChatTrigger &&
            execution.data.executionData !== undefined);
    }
    suspendRunningJobs() {
        this.suspensionRequested = true;
        const executionIds = [];
        for (const runningJob of Object.values(this.runningJobs)) {
            if (!runningJob.suspend?.())
                continue;
            executionIds.push(runningJob.executionId);
        }
        if (executionIds.length > 0) {
            this.logger.info(`Requested suspension of ${executionIds.length} execution(s) at the next node boundary (execution IDs: ${executionIds.join(', ')})`);
        }
    }
    getRunningJobsSummary() {
        return Object.values(this.runningJobs).map(({ run, ...summary }) => summary);
    }
    async invokeTool({ workflow, sourceNodeName, toolName, toolArgs, toolInput, additionalData, runExecutionData, executionContext, }) {
        const toolNode = workflow.getNode(sourceNodeName);
        if (!toolNode) {
            throw new n8n_workflow_1.UnexpectedError(`Tool node "${sourceNodeName}" not found in workflow`);
        }
        const nodeType = this.nodeTypes.getByNameAndVersion(toolNode.type, toolNode.typeVersion);
        const validatedToolArgs = typeof toolArgs === 'object' && toolArgs !== null && !Array.isArray(toolArgs) ? toolArgs : {};
        const { runData } = runExecutionData.resultData;
        const triggerNames = workflow.getChildNodes(sourceNodeName, n8n_workflow_1.NodeConnectionTypes.AiTool, 1);
        const triggerName = triggerNames.find((name) => runData[name]) ?? triggerNames[0];
        const parentNode = triggerName ? (workflow.getNode(triggerName) ?? undefined) : undefined;
        const inputData = [[{ json: toolInput ?? {} }]];
        runExecutionData.executionData ??= {
            contextData: {},
            nodeExecutionStack: [],
            metadata: {},
            waitingExecution: {},
            waitingExecutionSource: {},
        };
        if (executionContext) {
            runExecutionData.executionData.runtimeData = executionContext;
        }
        const executeData = {
            node: toolNode,
            data: {
                main: inputData,
            },
            source: null,
        };
        const closeFunctions = [];
        const context = new n8n_core_1.SupplyDataContext(workflow, toolNode, additionalData, 'webhook', runExecutionData, 0, inputData[0], { main: inputData }, n8n_workflow_1.NodeConnectionTypes.AiTool, executeData, closeFunctions, undefined, parentNode);
        try {
            if (nodeType.supplyData) {
                const supplyDataResult = await nodeType.supplyData.call(context, 0);
                if (supplyDataResult.closeFunction) {
                    closeFunctions.push(supplyDataResult.closeFunction);
                }
                let tool = supplyDataResult.response;
                if (tool instanceof n8n_core_1.StructuredToolkit) {
                    tool = tool.tools.find((member) => member.name === toolName);
                    if (!tool) {
                        throw new n8n_workflow_1.UnexpectedError(`Tool "${toolName}" not found in toolkit from node "${sourceNodeName}"`);
                    }
                }
                if (!isInvokableTool(tool)) {
                    throw new n8n_workflow_1.UnexpectedError(`Tool node "${sourceNodeName}" did not return a valid Tool`);
                }
                return await tool.invoke(validatedToolArgs);
            }
            if (nodeType.execute && nodeType.description.outputs.includes(n8n_workflow_1.NodeConnectionTypes.AiTool)) {
                const toolRunIndex = context.getNextRunIndex();
                const recordToolData = async (type, data) => {
                    try {
                        await context.addExecutionDataFunctions(type, data, n8n_workflow_1.NodeConnectionTypes.AiTool, toolNode.name, toolRunIndex);
                    }
                    catch (error) {
                        this.logger.warn(`There was a problem logging ${type} data of node "${toolNode.name}": ${error instanceof Error ? error.message : String(error)}`);
                    }
                };
                await recordToolData('input', [
                    [{ json: validatedToolArgs }],
                ]);
                let result;
                try {
                    result = await nodeType.execute.call(context);
                }
                catch (error) {
                    await recordToolData('output', error instanceof n8n_workflow_1.NodeOperationError
                        ? error
                        : new n8n_workflow_1.NodeOperationError(toolNode, error));
                    throw error;
                }
                let response = [];
                if (Array.isArray(result)) {
                    response = result?.[0]?.flatMap((item) => item.json);
                }
                await recordToolData('output', [[{ json: { response } }]]);
                return response;
            }
            throw new n8n_workflow_1.UnexpectedError(`Tool node "${sourceNodeName}" does not have supplyData or execute method`);
        }
        finally {
            for (const closeFunction of closeFunctions) {
                try {
                    await closeFunction();
                }
                catch (error) {
                    this.logger.warn(`Error closing tool resource: ${error}`);
                }
            }
        }
    }
};
exports.JobProcessor = JobProcessor;
exports.JobProcessor = JobProcessor = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, db_1.WorkflowRepository, node_types_1.NodeTypes, n8n_core_1.InstanceSettings, manual_execution_service_1.ManualExecutionService, config_1.ExecutionsConfig, backend_services_1.EventService, webhook_response_relay_1.WebhookResponseRelay])
], JobProcessor);
//# sourceMappingURL=job-processor.js.map