"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLifecycleHooksForSubExecutions = getLifecycleHooksForSubExecutions;
exports.getLifecycleHooksForScalingWorker = getLifecycleHooksForScalingWorker;
exports.getLifecycleHooksForScalingMain = getLifecycleHooksForScalingMain;
exports.getLifecycleHooksForRegularMain = getLifecycleHooksForRegularMain;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const flatted_1 = require("flatted");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const execute_error_workflow_1 = require("./execute-error-workflow");
const restore_binary_data_id_1 = require("./restore-binary-data-id");
const save_execution_progress_1 = require("./save-execution-progress");
const shared_hook_functions_1 = require("./shared/shared-hook-functions");
const to_save_settings_1 = require("./to-save-settings");
const execution_persistence_1 = require("../executions/execution-persistence");
const external_hooks_1 = require("../external-hooks");
const push_1 = require("../push");
const workflow_statistics_service_1 = require("../services/workflow-statistics.service");
const utils_1 = require("../utils");
const get_item_count_by_connection_type_1 = require("../utils/get-item-count-by-connection-type");
const workflow_helpers_1 = require("../workflow-helpers");
const workflow_hook_context_service_1 = require("../workflow-hook-context.service");
const workflow_static_data_service_1 = require("../workflows/workflow-static-data.service");
let ModulesHooksRegistry = class ModulesHooksRegistry {
    addHooks(hooks, source, { executedInThisProcess = true } = {}) {
        const handlers = di_1.Container.get(decorators_1.LifecycleMetadata).getHandlers();
        for (const { handlerClass, methodName, eventName } of handlers) {
            const instance = di_1.Container.get(handlerClass);
            switch (eventName) {
                case 'workflowExecuteAfter':
                    hooks.addHandler(eventName, async function (runData, newStaticData) {
                        const context = {
                            type: 'workflowExecuteAfter',
                            workflow: this.workflowData,
                            mode: this.mode,
                            runData,
                            newStaticData,
                            executionId: this.executionId,
                            retryOf: this.retryOf,
                            source,
                            executedInThisProcess,
                        };
                        return await instance[methodName].call(instance, context);
                    });
                    break;
                case 'nodeExecuteBefore':
                    hooks.addHandler(eventName, async function (nodeName, taskData) {
                        const context = {
                            type: 'nodeExecuteBefore',
                            workflow: this.workflowData,
                            mode: this.mode,
                            nodeName,
                            taskData,
                            executionId: this.executionId,
                        };
                        return await instance[methodName].call(instance, context);
                    });
                    break;
                case 'nodeExecuteAfter':
                    hooks.addHandler(eventName, async function (nodeName, taskData, executionData) {
                        const context = {
                            type: 'nodeExecuteAfter',
                            workflow: this.workflowData,
                            mode: this.mode,
                            nodeName,
                            taskData,
                            executionData,
                            executionId: this.executionId,
                        };
                        return await instance[methodName].call(instance, context);
                    });
                    break;
                case 'workflowExecuteBefore':
                    hooks.addHandler(eventName, async function (workflowInstance, executionData) {
                        const context = {
                            type: 'workflowExecuteBefore',
                            workflow: this.workflowData,
                            mode: this.mode,
                            workflowInstance,
                            executionData,
                            executionId: this.executionId,
                        };
                        return await instance[methodName].call(instance, context);
                    });
                    break;
                case 'workflowExecuteResume':
                    hooks.addHandler(eventName, async function (workflowInstance, executionData) {
                        const context = {
                            type: 'workflowExecuteResume',
                            workflow: this.workflowData,
                            mode: this.mode,
                            workflowInstance,
                            executionData,
                            executionId: this.executionId,
                        };
                        return await instance[methodName].call(instance, context);
                    });
                    break;
            }
        }
    }
};
ModulesHooksRegistry = __decorate([
    (0, di_1.Service)()
], ModulesHooksRegistry);
function hookFunctionsWorkflowEvents(hooks, userId, projectId, projectName, source, telemetryMetadata) {
    const eventService = di_1.Container.get(backend_services_1.EventService);
    hooks.addHandler('workflowExecuteBefore', function () {
        const { executionId, workflowData, mode } = this;
        eventService.emit('workflow-pre-execute', {
            executionId,
            data: workflowData,
            mode,
            projectId,
            projectName,
        });
    });
    hooks.addHandler('workflowExecuteAfter', function (runData) {
        if (runData.status === 'waiting') {
            const { executionId, workflowData: workflow } = this;
            const lastNodeName = runData.data.resultData.lastNodeExecuted;
            const lastNodeTaskData = lastNodeName
                ? runData.data.resultData.runData[lastNodeName]
                : undefined;
            const latestTask = lastNodeTaskData?.at(-1);
            const isWaitingForWebhook = latestTask?.metadata?.resumeUrl;
            if (isWaitingForWebhook) {
                eventService.emit('execution-waiting', {
                    executionId,
                    workflowId: workflow.id,
                });
            }
            return;
        }
        const { executionId, workflowData: workflow } = this;
        if (runData.data.startData) {
            const originalDestination = runData.data.startData.originalDestinationNode;
            if (originalDestination) {
                runData.data.startData.destinationNode = originalDestination;
                runData.data.startData.originalDestinationNode = undefined;
            }
        }
        eventService.emit('workflow-post-execute', {
            executionId,
            runData,
            workflow,
            userId,
            projectId,
            projectName,
            ...(source ? { source } : {}),
            ...(telemetryMetadata ? { telemetryMetadata } : {}),
        });
    });
}
function hookFunctionsNodeEvents(hooks) {
    const eventService = di_1.Container.get(backend_services_1.EventService);
    hooks.addHandler('nodeExecuteBefore', function (nodeName) {
        const { executionId, workflowData: workflow } = this;
        const node = workflow.nodes.find((n) => n.name === nodeName);
        eventService.emit('node-pre-execute', {
            executionId,
            workflow,
            nodeId: node?.id,
            nodeName,
            nodeType: node?.type,
        });
    });
    hooks.addHandler('nodeExecuteAfter', function (nodeName) {
        const { executionId, workflowData: workflow } = this;
        const node = workflow.nodes.find((n) => n.name === nodeName);
        eventService.emit('node-post-execute', {
            executionId,
            workflow,
            nodeId: node?.id,
            nodeName,
            nodeType: node?.type,
        });
    });
}
function buildRedactableExecution(hooks, runData, executionData) {
    return {
        id: hooks.executionId,
        mode: hooks.mode,
        workflowId: hooks.workflowData.id,
        data: {
            resultData: { runData },
            executionData: executionData?.executionData,
        },
        workflowData: {
            settings: hooks.workflowData.settings,
            nodes: hooks.workflowData.nodes,
        },
    };
}
function hookFunctionsPush(hooks, { pushRef, retryOf }, userId, source) {
    if (!pushRef)
        return;
    const logger = di_1.Container.get(backend_common_1.Logger);
    const pushInstance = di_1.Container.get(push_1.Push);
    const redactionProxy = di_1.Container.get(backend_services_1.ExecutionRedactionServiceProxy);
    const userRepository = di_1.Container.get(db_1.UserRepository);
    let resolvedUser;
    async function getUser() {
        if (resolvedUser !== undefined)
            return resolvedUser;
        resolvedUser = userId
            ? await userRepository.findOne({ where: { id: userId }, relations: ['role'] })
            : null;
        return resolvedUser;
    }
    let nodeEventSequence = 0;
    hooks.addHandler('nodeExecuteBefore', function (nodeName, data) {
        const { executionId } = this;
        logger.debug(`Executing hook on node "${nodeName}" (hookFunctionsPush)`, {
            executionId,
            pushRef,
            workflowId: this.workflowData.id,
        });
        pushInstance.send({
            type: 'nodeExecuteBefore',
            data: { executionId, nodeName, sequenceNumber: nodeEventSequence++, data },
        }, pushRef);
    });
    hooks.addHandler('nodeExecuteAfter', async function (nodeName, data, executionData) {
        const { executionId } = this;
        logger.debug(`Executing hook on node "${nodeName}" (hookFunctionsPush)`, {
            executionId,
            pushRef,
            workflowId: this.workflowData.id,
        });
        const itemCountByConnectionType = (0, get_item_count_by_connection_type_1.getItemCountByConnectionType)(data?.data);
        const { data: _, ...taskData } = data;
        pushInstance.send({
            type: 'nodeExecuteAfter',
            data: {
                executionId,
                nodeName,
                sequenceNumber: nodeEventSequence++,
                itemCountByConnectionType,
                data: taskData,
            },
        }, pushRef);
        const user = await getUser();
        if (!user) {
            logger.warn('Skipping execution data push: unable to resolve user for redaction', {
                executionId,
                nodeName,
                userId,
            });
            return;
        }
        let dataToSend = data;
        try {
            const dummy = buildRedactableExecution(this, { [nodeName]: [data] }, executionData);
            const result = await redactionProxy.processExecution(dummy, {
                user,
                keepOriginal: true,
            });
            if (result !== dummy) {
                dataToSend = result.data.resultData.runData[nodeName][0];
            }
        }
        catch (error) {
            logger.error('Failed to redact push data, skipping nodeExecuteAfterData', {
                executionId,
                nodeName,
                error,
            });
            return;
        }
        const asBinary = true;
        pushInstance.send({
            type: 'nodeExecuteAfterData',
            data: { executionId, nodeName, itemCountByConnectionType, data: dataToSend },
        }, pushRef, asBinary);
    });
    hooks.addHandler('workflowExecuteBefore', async function (_workflow, data) {
        const { executionId } = this;
        const { id: workflowId, name: workflowName } = this.workflowData;
        logger.debug('Executing hook (hookFunctionsPush)', {
            executionId,
            pushRef,
            workflowId,
        });
        const user = await getUser();
        let runDataToStringify = {};
        const hasRunData = data?.resultData.runData && Object.keys(data.resultData.runData).length > 0;
        if (hasRunData && user) {
            try {
                const dummy = buildRedactableExecution(this, data.resultData.runData, data);
                const result = await redactionProxy.processExecution(dummy, {
                    user,
                    keepOriginal: true,
                });
                runDataToStringify =
                    result !== dummy ? result.data.resultData.runData : data.resultData.runData;
            }
            catch (error) {
                logger.error('Failed to redact execution start data, sending empty runData', {
                    executionId,
                    workflowId,
                    error,
                });
            }
        }
        else if (hasRunData && !user) {
            logger.warn('Cannot redact execution start data: unable to resolve user', {
                executionId,
                workflowId,
                userId,
            });
        }
        pushInstance.send({
            type: 'executionStarted',
            data: {
                executionId,
                mode: this.mode,
                source,
                startedAt: new Date(),
                retryOf,
                workflowId,
                workflowName,
                flattedRunData: (0, flatted_1.stringify)(runDataToStringify),
            },
        }, pushRef);
    });
    hooks.addHandler('workflowExecuteAfter', function (fullRunData) {
        const { executionId } = this;
        const { id: workflowId } = this.workflowData;
        logger.debug('Executing hook (hookFunctionsPush)', {
            executionId,
            pushRef,
            workflowId,
        });
        const { status } = fullRunData;
        if (status === 'waiting') {
            pushInstance.send({ type: 'executionWaiting', data: { executionId, source } }, pushRef);
        }
        else {
            pushInstance.send({ type: 'executionFinished', data: { executionId, workflowId, status, source } }, pushRef);
        }
    });
}
function hookFunctionsPreExecute(hooks, source) {
    if (!di_1.Container.get(config_1.ExecutionsConfig).preExecuteErrorCreatesExecution) {
        return;
    }
    const externalHooks = di_1.Container.get(external_hooks_1.ExternalHooks);
    const workflowContext = di_1.Container.get(workflow_hook_context_service_1.WorkflowHookContextService);
    hooks.addHandler('workflowExecuteBefore', async function (workflow) {
        await externalHooks.run('workflow.preExecute', [workflow, this.mode, workflowContext, source]);
    });
}
function hookFunctionsPostExecute(hooks) {
    const externalHooks = di_1.Container.get(external_hooks_1.ExternalHooks);
    const workflowContext = di_1.Container.get(workflow_hook_context_service_1.WorkflowHookContextService);
    hooks.addHandler('workflowExecuteAfter', async function (fullRunData) {
        await externalHooks.run('workflow.postExecute', [
            fullRunData,
            this.workflowData,
            this.executionId,
            workflowContext,
        ]);
    });
}
function hookFunctionsSaveProgress(hooks, { saveSettings }) {
    if (!saveSettings.progress)
        return;
    hooks.addHandler('nodeExecuteAfter', async function (nodeName, data, executionData) {
        await (0, save_execution_progress_1.saveExecutionProgress)(this.workflowData.id, this.executionId, nodeName, data, executionData);
    });
}
function hookFunctionsFinalizeExecutionStatus(hooks) {
    hooks.addHandler('workflowExecuteAfter', (fullRunData) => {
        fullRunData.status = (0, shared_hook_functions_1.determineFinalExecutionStatus)(fullRunData);
    });
}
function hookFunctionsStatistics(hooks, source) {
    const workflowStatisticsService = di_1.Container.get(workflow_statistics_service_1.WorkflowStatisticsService);
    hooks.addHandler('nodeFetchedData', (workflowId, node) => {
        workflowStatisticsService.emit('nodeFetchedData', { workflowId, node, source });
    });
}
async function duplicateBinaryDataToParent(fullRunData, parentExecution, binaryDataService) {
    const outputRuns = fullRunData.data.subWorkflowOutput?.lastRunOnly === false
        ? (0, workflow_helpers_1.getLastExecutedNodeRuns)(fullRunData)
        : [(0, workflow_helpers_1.getLastExecutedNodeData)(fullRunData)];
    for (const outputData of outputRuns) {
        if (!outputData?.data?.main)
            continue;
        const duplicatedData = await binaryDataService.duplicateBinaryData(n8n_core_1.FileLocation.ofExecution(parentExecution.workflowId, parentExecution.executionId), outputData.data.main);
        outputData.data.main = duplicatedData;
    }
}
function hookFunctionsSave(hooks, { pushRef, retryOf, saveSettings, parentExecution, source, suppressErrorWorkflow, }) {
    const logger = di_1.Container.get(backend_common_1.Logger);
    const errorReporter = di_1.Container.get(n8n_core_1.ErrorReporter);
    const executionRepository = di_1.Container.get(db_1.ExecutionRepository);
    const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
    const binaryDataService = di_1.Container.get(n8n_core_1.BinaryDataService);
    const workflowStaticDataService = di_1.Container.get(workflow_static_data_service_1.WorkflowStaticDataService);
    const workflowStatisticsService = di_1.Container.get(workflow_statistics_service_1.WorkflowStatisticsService);
    hooks.addHandler('workflowExecuteAfter', async function (fullRunData, newStaticData) {
        logger.debug('Executing hook (hookFunctionsSave)', {
            executionId: this.executionId,
            workflowId: this.workflowData.id,
        });
        await (0, restore_binary_data_id_1.restoreBinaryDataId)(fullRunData, this.executionId, this.mode);
        const parent = parentExecution ?? fullRunData.data.parentExecution;
        if (parent) {
            await duplicateBinaryDataToParent(fullRunData, parent, binaryDataService);
        }
        const isManualMode = this.mode === 'manual';
        const dispatchesErrorWorkflow = !isManualMode && !suppressErrorWorkflow;
        try {
            if (!isManualMode && (0, utils_1.isWorkflowIdValid)(this.workflowData.id) && newStaticData) {
                try {
                    await workflowStaticDataService.saveStaticDataById(this.workflowData.id, newStaticData);
                }
                catch (e) {
                    errorReporter.error(e);
                    logger.error(`There was a problem saving the workflow with id "${this.workflowData.id}" to save changed staticData: "${e.message}" (hookFunctionsSave)`, { executionId: this.executionId, workflowId: this.workflowData.id });
                }
            }
            if (isManualMode && !saveSettings.manual && !fullRunData.waitTill) {
                await executionRepository.softDelete(this.executionId);
                return;
            }
            const shouldNotSave = (fullRunData.status === 'success' && !saveSettings.success) ||
                (fullRunData.status !== 'success' && !saveSettings.error);
            if (shouldNotSave && !fullRunData.waitTill && !isManualMode) {
                if (dispatchesErrorWorkflow) {
                    (0, execute_error_workflow_1.executeErrorWorkflow)(this.workflowData, fullRunData, this.mode, this.executionId, retryOf);
                }
                await executionPersistence.deleteInFlightExecution({
                    workflowId: this.workflowData.id,
                    executionId: this.executionId,
                    storedAt: fullRunData.storedAt,
                });
                return;
            }
            const fullExecutionData = (0, shared_hook_functions_1.prepareExecutionDataForDbUpdate)({
                runData: fullRunData,
                workflowData: this.workflowData,
                workflowStatusFinal: fullRunData.status,
                retryOf,
            });
            if (fullRunData.waitTill && isManualMode) {
                fullExecutionData.data.pushRef = pushRef;
            }
            const resultRunData = fullRunData.data?.resultData?.runData;
            fullExecutionData.usedPrivateCredentials =
                (0, n8n_workflow_1.runDataUsedDynamicCredentials)(resultRunData) ||
                    (0, n8n_workflow_1.runDataAttemptedDynamicCredentials)(resultRunData);
            await (0, shared_hook_functions_1.updateExistingExecution)({
                executionId: this.executionId,
                workflowId: this.workflowData.id,
                executionData: fullExecutionData,
                conditions: { requireNotCanceled: true },
            });
            await (0, shared_hook_functions_1.updateExistingExecutionMetadata)(this.executionId, fullRunData.data?.resultData?.metadata);
            if (dispatchesErrorWorkflow) {
                (0, execute_error_workflow_1.executeErrorWorkflow)(this.workflowData, fullRunData, this.mode, this.executionId, retryOf);
            }
        }
        finally {
            workflowStatisticsService.emit('workflowExecutionCompleted', {
                workflowData: this.workflowData,
                fullRunData,
                source,
            });
        }
    });
}
const DISCARDABLE_DATA_MODES = ['trigger', 'cli', 'error', 'internal'];
function hookFunctionsSaveWorker(hooks, { pushRef, retryOf, saveSettings, source, suppressErrorWorkflow }) {
    const logger = di_1.Container.get(backend_common_1.Logger);
    const errorReporter = di_1.Container.get(n8n_core_1.ErrorReporter);
    const binaryDataService = di_1.Container.get(n8n_core_1.BinaryDataService);
    const workflowStaticDataService = di_1.Container.get(workflow_static_data_service_1.WorkflowStaticDataService);
    const workflowStatisticsService = di_1.Container.get(workflow_statistics_service_1.WorkflowStatisticsService);
    hooks.addHandler('workflowExecuteAfter', async function (fullRunData, newStaticData) {
        logger.debug('Executing hook (hookFunctionsSaveWorker)', {
            executionId: this.executionId,
            workflowId: this.workflowData.id,
        });
        const { parentExecution } = fullRunData.data;
        if (parentExecution) {
            await duplicateBinaryDataToParent(fullRunData, parentExecution, binaryDataService);
        }
        const isManualMode = this.mode === 'manual';
        let wasUpdated = true;
        try {
            if (!isManualMode && (0, utils_1.isWorkflowIdValid)(this.workflowData.id) && newStaticData) {
                try {
                    await workflowStaticDataService.saveStaticDataById(this.workflowData.id, newStaticData);
                }
                catch (e) {
                    errorReporter.error(e);
                    logger.error(`There was a problem saving the workflow with id "${this.workflowData.id}" to save changed staticData: "${e.message}" (workflowExecuteAfter)`, { workflowId: this.workflowData.id });
                }
            }
            if (!isManualMode &&
                !suppressErrorWorkflow &&
                fullRunData.status !== 'success' &&
                fullRunData.status !== 'waiting') {
                (0, execute_error_workflow_1.executeErrorWorkflow)(this.workflowData, fullRunData, this.mode, this.executionId, retryOf);
            }
            const fullExecutionData = (0, shared_hook_functions_1.prepareExecutionDataForDbUpdate)({
                runData: fullRunData,
                workflowData: this.workflowData,
                workflowStatusFinal: fullRunData.status,
                retryOf,
            });
            if (fullRunData.waitTill && isManualMode) {
                fullExecutionData.data.pushRef = pushRef;
            }
            const resultRunData = fullRunData.data?.resultData?.runData;
            fullExecutionData.usedPrivateCredentials =
                (0, n8n_workflow_1.runDataUsedDynamicCredentials)(resultRunData) ||
                    (0, n8n_workflow_1.runDataAttemptedDynamicCredentials)(resultRunData);
            const mainWillDiscardData = fullRunData.status === 'success' &&
                !saveSettings.success &&
                !fullRunData.waitTill &&
                DISCARDABLE_DATA_MODES.includes(this.mode) &&
                !di_1.Container.get(external_hooks_1.ExternalHooks).hasHook('workflow.postExecute');
            const executionData = mainWillDiscardData
                ? { ...fullExecutionData, data: undefined, workflowData: undefined }
                : fullExecutionData;
            wasUpdated = await (0, shared_hook_functions_1.updateExistingExecution)({
                executionId: this.executionId,
                workflowId: this.workflowData.id,
                executionData,
                conditions: fullRunData.status === 'canceled' ? undefined : { requireNotCanceled: true },
            });
        }
        finally {
            if (wasUpdated) {
                workflowStatisticsService.emit('workflowExecutionCompleted', {
                    workflowData: this.workflowData,
                    fullRunData,
                    source,
                });
            }
        }
    });
}
function getLifecycleHooksForSubExecutions(mode, executionId, workflowData, userId, parentExecution, projectId, projectName) {
    const hooks = new n8n_core_1.ExecutionLifecycleHooks(mode, executionId, workflowData);
    const saveSettings = (0, to_save_settings_1.toSaveSettings)(workflowData.settings);
    hookFunctionsWorkflowEvents(hooks, userId, projectId, projectName);
    hookFunctionsNodeEvents(hooks);
    hookFunctionsFinalizeExecutionStatus(hooks);
    hookFunctionsSave(hooks, { saveSettings, parentExecution });
    hookFunctionsSaveProgress(hooks, { saveSettings });
    hookFunctionsStatistics(hooks);
    hookFunctionsPreExecute(hooks);
    hookFunctionsPostExecute(hooks);
    di_1.Container.get(ModulesHooksRegistry).addHooks(hooks);
    return hooks;
}
function resolveSuppressErrorWorkflow(data) {
    return data.suppressErrorWorkflow ?? data.executionData?.manualData?.suppressErrorWorkflow;
}
function getLifecycleHooksForScalingWorker(data, executionId) {
    const { pushRef, retryOf, executionMode, workflowData, source } = data;
    const suppressErrorWorkflow = resolveSuppressErrorWorkflow(data);
    const hooks = new n8n_core_1.ExecutionLifecycleHooks(executionMode, executionId, workflowData, retryOf ?? undefined);
    const saveSettings = (0, to_save_settings_1.toSaveSettings)(workflowData.settings);
    const optionalParameters = {
        pushRef,
        retryOf: retryOf ?? undefined,
        saveSettings,
        source,
        suppressErrorWorkflow,
    };
    hookFunctionsNodeEvents(hooks);
    hookFunctionsFinalizeExecutionStatus(hooks);
    hookFunctionsSaveWorker(hooks, optionalParameters);
    hookFunctionsSaveProgress(hooks, optionalParameters);
    hookFunctionsStatistics(hooks, source);
    hookFunctionsPreExecute(hooks, source);
    hookFunctionsPostExecute(hooks);
    if (executionMode === 'manual' && di_1.Container.get(n8n_core_1.InstanceSettings).isWorker) {
        hookFunctionsPush(hooks, optionalParameters, data.userId, data.source);
    }
    di_1.Container.get(ModulesHooksRegistry).addHooks(hooks, source);
    return hooks;
}
function getLifecycleHooksForScalingMain(data, executionId) {
    const { pushRef, retryOf, executionMode, workflowData, userId, projectId, projectName, source, telemetryMetadata, } = data;
    const hooks = new n8n_core_1.ExecutionLifecycleHooks(executionMode, executionId, workflowData, retryOf ?? undefined);
    const saveSettings = (0, to_save_settings_1.toSaveSettings)(workflowData.settings);
    const optionalParameters = { pushRef, retryOf: retryOf ?? undefined, saveSettings };
    const executionRepository = di_1.Container.get(db_1.ExecutionRepository);
    const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
    hookFunctionsWorkflowEvents(hooks, userId, projectId, projectName, source, telemetryMetadata);
    hookFunctionsSaveProgress(hooks, optionalParameters);
    hookFunctionsPreExecute(hooks, source);
    hookFunctionsPostExecute(hooks);
    hookFunctionsFinalizeExecutionStatus(hooks);
    hooks.addHandler('workflowExecuteAfter', async function (fullRunData) {
        const terminalStatuses = ['success', 'error', 'crashed', 'canceled'];
        if (!terminalStatuses.includes(fullRunData.status) && !fullRunData.waitTill)
            return;
        const isManualMode = this.mode === 'manual';
        if (isManualMode && !saveSettings.manual && !fullRunData.waitTill) {
            await executionRepository.softDelete(this.executionId);
            return;
        }
        const shouldNotSave = (fullRunData.status === 'success' && !saveSettings.success) ||
            (fullRunData.status !== 'success' && !saveSettings.error);
        if (!isManualMode && shouldNotSave && !fullRunData.waitTill) {
            await executionPersistence.deleteInFlightExecution({
                workflowId: this.workflowData.id,
                executionId: this.executionId,
                storedAt: fullRunData.storedAt,
            });
        }
        else {
            await (0, shared_hook_functions_1.updateExistingExecutionMetadata)(this.executionId, fullRunData.data?.resultData?.metadata);
        }
    });
    hooks.handlers.nodeExecuteBefore = [];
    hooks.handlers.nodeExecuteAfter = [];
    di_1.Container.get(ModulesHooksRegistry).addHooks(hooks, source, { executedInThisProcess: false });
    return hooks;
}
function getLifecycleHooksForRegularMain(data, executionId) {
    const { pushRef, retryOf, executionMode, workflowData, userId, projectId, projectName, source, telemetryMetadata, } = data;
    const suppressErrorWorkflow = resolveSuppressErrorWorkflow(data);
    const hooks = new n8n_core_1.ExecutionLifecycleHooks(executionMode, executionId, workflowData, retryOf ?? undefined);
    const saveSettings = (0, to_save_settings_1.toSaveSettings)(workflowData.settings);
    const optionalParameters = {
        pushRef,
        retryOf: retryOf ?? undefined,
        saveSettings,
        source,
        suppressErrorWorkflow,
    };
    hookFunctionsWorkflowEvents(hooks, userId, projectId, projectName, source, telemetryMetadata);
    hookFunctionsNodeEvents(hooks);
    hookFunctionsFinalizeExecutionStatus(hooks);
    hookFunctionsSave(hooks, optionalParameters);
    hookFunctionsPush(hooks, optionalParameters, userId, source);
    hookFunctionsSaveProgress(hooks, optionalParameters);
    hookFunctionsStatistics(hooks, source);
    hookFunctionsPreExecute(hooks, source);
    hookFunctionsPostExecute(hooks);
    di_1.Container.get(ModulesHooksRegistry).addHooks(hooks, source);
    return hooks;
}
//# sourceMappingURL=execution-lifecycle-hooks.js.map