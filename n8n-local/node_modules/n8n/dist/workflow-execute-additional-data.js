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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRunData = getRunData;
exports.getDraftWorkflowData = getDraftWorkflowData;
exports.getPublishedWorkflowData = getPublishedWorkflowData;
exports.executeWorkflow = executeWorkflow;
exports.executeAgent = executeAgent;
exports.triggerReturnsLastRunOnly = triggerReturnsLastRunOnly;
exports.buildSubWorkflowOutput = buildSubWorkflowOutput;
exports.setExecutionStatus = setExecutionStatus;
exports.sendDataToUI = sendDataToUI;
exports.getBase = getBase;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const workflow_agent_stream_1 = require("./modules/agents/workflow-agent-stream");
const active_executions_1 = require("./active-executions");
const credential_sharing_1 = require("./constants/credential-sharing");
const credentials_helper_1 = require("./credentials-helper");
const pre_execute_blocked_error_1 = require("./errors/pre-execute-blocked.error");
const execution_lifecycle_hooks_1 = require("./execution-lifecycle/execution-lifecycle-hooks");
const execution_persistence_1 = require("./executions/execution-persistence");
const execution_utils_1 = require("./executions/execution.utils");
const failed_run_factory_1 = require("./executions/failed-run-factory");
const pre_execution_checks_1 = require("./executions/pre-execution-checks");
const node_types_1 = require("./node-types");
const push_1 = require("./push");
const task_requester_1 = require("./task-runners/task-managers/task-requester");
const utils_1 = require("./utils");
const object_to_error_1 = require("./utils/object-to-error");
const WorkflowHelpers = __importStar(require("./workflow-helpers"));
const deprecated_nodes_validation_service_1 = require("./workflows/deprecated-nodes-validation.service");
const utils_2 = require("./workflows/utils");
function getRunData(workflowData, inputData, parentExecution) {
    const mode = 'integrated';
    const startingNode = (0, utils_1.findSubworkflowStart)(workflowData.nodes);
    inputData = inputData || [
        {
            json: {},
        },
    ];
    const nodeExecutionStack = [];
    nodeExecutionStack.push({
        node: startingNode,
        data: {
            main: [inputData],
        },
        metadata: { parentExecution },
        source: null,
    });
    const runExecutionData = (0, n8n_workflow_1.createRunExecutionData)({
        executionData: {
            nodeExecutionStack,
        },
        parentExecution,
    });
    return {
        executionMode: mode,
        executionData: runExecutionData,
        workflowData,
    };
}
async function fetchWorkflowData(workflowInfo, parentWorkflowId, parentWorkflowSettings) {
    if (workflowInfo.id === undefined && workflowInfo.code === undefined) {
        throw new n8n_workflow_1.UnexpectedError('No information about the workflow to execute found. Please provide either the "id" or "code"!');
    }
    if (workflowInfo.id !== undefined) {
        const baseRelations = ['activeVersion'];
        const relations = di_1.Container.get(config_1.GlobalConfig).tags.disabled
            ? [...baseRelations]
            : [...baseRelations, 'tags'];
        const workflowFromDb = await di_1.Container.get(db_1.WorkflowRepository).get({ id: workflowInfo.id }, { relations });
        if (workflowFromDb === undefined || workflowFromDb === null) {
            throw new n8n_workflow_1.UnexpectedError('Workflow does not exist.', {
                extra: { workflowId: workflowInfo.id },
            });
        }
        return workflowFromDb;
    }
    else {
        const workflowData = workflowInfo.code;
        if (workflowData) {
            di_1.Container.get(deprecated_nodes_validation_service_1.DeprecatedNodesValidationService).validateOnCreate(workflowData.nodes ?? [], parentWorkflowId);
            WorkflowHelpers.validateWorkflowStructure(workflowData);
            workflowData.id = parentWorkflowId;
            workflowData.settings ??= parentWorkflowSettings;
        }
        return workflowData;
    }
}
async function getDraftWorkflowData(workflowInfo, parentWorkflowId, parentWorkflowSettings) {
    const workflowData = await fetchWorkflowData(workflowInfo, parentWorkflowId, parentWorkflowSettings);
    return workflowData;
}
async function getPublishedWorkflowData(workflowInfo, parentWorkflowId, parentWorkflowSettings) {
    if (workflowInfo.id !== undefined &&
        di_1.Container.get(config_1.WorkflowsConfig).useWorkflowPublicationService) {
        const publishedData = await di_1.Container.get(backend_services_1.WorkflowPublishedDataService).getPublishedWorkflowData(workflowInfo.id);
        if (publishedData === null) {
            throw new n8n_workflow_1.OperationalError('Workflow is not active and cannot be executed.', {
                extra: { workflowId: workflowInfo.id, parentWorkflowId },
            });
        }
        return {
            ...publishedData.workflow,
            versionId: publishedData.publishedVersion.versionId,
            nodes: publishedData.publishedVersion.nodes,
            connections: publishedData.publishedVersion.connections,
        };
    }
    const workflowData = await fetchWorkflowData(workflowInfo, parentWorkflowId, parentWorkflowSettings);
    if (workflowInfo.code !== undefined) {
        return workflowData;
    }
    if (workflowData && 'activeVersion' in workflowData && workflowData.activeVersion) {
        return {
            ...workflowData,
            versionId: workflowData.activeVersion.versionId,
            nodes: workflowData.activeVersion.nodes,
            connections: workflowData.activeVersion.connections,
        };
    }
    throw new n8n_workflow_1.UnexpectedError('Workflow is not active and cannot be executed.', {
        extra: { workflowId: workflowInfo.id },
    });
}
function determineWorkflowDeadline(startTime, workflowSettings, executionsConfig) {
    const effectiveMaxTimeout = executionsConfig.maxTimeout > 0 ? executionsConfig.maxTimeout : Infinity;
    if (workflowSettings?.executionTimeout !== undefined) {
        if (workflowSettings.executionTimeout <= 0) {
            return undefined;
        }
        return (startTime +
            Math.min(workflowSettings.executionTimeout, effectiveMaxTimeout) * constants_1.Time.seconds.toMilliseconds);
    }
    if (executionsConfig.timeout > 0) {
        return (startTime +
            Math.min(executionsConfig.timeout, effectiveMaxTimeout) * constants_1.Time.seconds.toMilliseconds);
    }
    return undefined;
}
function resolveSubworkflowDeadline(subWorkflowDeadline, parentDeadline, doNotWaitToFinish) {
    if (doNotWaitToFinish) {
        return subWorkflowDeadline;
    }
    if (parentDeadline !== undefined && subWorkflowDeadline !== undefined) {
        return Math.min(parentDeadline, subWorkflowDeadline);
    }
    return parentDeadline ?? subWorkflowDeadline;
}
async function executeWorkflow(workflowInfo, additionalData, options) {
    const activeExecutions = di_1.Container.get(active_executions_1.ActiveExecutions);
    const useDraftVersion = (0, execution_utils_1.isManualOrChatExecution)(options.executionMode);
    const workflowData = options.loadedWorkflowData ??
        (useDraftVersion
            ? await getDraftWorkflowData(workflowInfo, options.parentWorkflowId, options.parentWorkflowSettings)
            : await getPublishedWorkflowData(workflowInfo, options.parentWorkflowId, options.parentWorkflowSettings));
    const runData = options.loadedRunData ?? getRunData(workflowData, options.inputData, options.parentExecution);
    if (runData.executionData) {
        runData.executionData.subWorkflowOutput ??= (0, n8n_workflow_1.getSubWorkflowOutputPolicy)(workflowData.nodes, options.returnLastRunOnly ?? false);
    }
    try {
        await di_1.Container.get(pre_execution_checks_1.WorkflowPreExecute).run(workflowData, runData.executionMode, runData.source);
    }
    catch (error) {
        throw pre_execute_blocked_error_1.PreExecuteBlockedError.unwrap(error);
    }
    const executionId = await activeExecutions.add(runData);
    const { OwnershipService } = await import('./services/ownership.service.js');
    const { projectId, projectName } = await (0, utils_2.getWorkflowProjectDetailsSafe)(di_1.Container.get(OwnershipService), workflowData.id);
    di_1.Container.get(backend_services_1.EventService).emit('workflow-executed', {
        user: additionalData.userId ? { id: additionalData.userId } : undefined,
        workflowId: workflowData.id,
        workflowName: workflowData.name,
        executionId,
        projectId,
        projectName,
        source: 'integrated',
    });
    const isInlineSubworkflow = workflowInfo.code !== undefined && workflowInfo.id === undefined;
    const executionPromise = startExecution(additionalData, options, executionId, runData, workflowData, isInlineSubworkflow);
    if (options.doNotWaitToFinish) {
        executionPromise.catch((error) => {
            di_1.Container.get(backend_common_1.Logger).debug('Detached sub-workflow execution failed', {
                executionId,
                workflowId: workflowData.id,
                error,
            });
        });
        return { executionId, data: [null] };
    }
    return await executionPromise;
}
function assertAgentsModuleActive() {
    if (!di_1.Container.get(backend_common_1.ModuleRegistry).isActive('agents')) {
        throw new n8n_workflow_1.UserError('Agents are disabled on this instance. Ask an instance admin to enable the agents module.');
    }
}
async function executeAgent(source, message, executionId, threadId, additionalData, executionMode, outputSchema, workflowContext, invocationContext, prepareForEval) {
    assertAgentsModuleActive();
    const telemetryUserId = additionalData.userId;
    let projectId = additionalData.projectId;
    if (!projectId && additionalData.workflowId) {
        const { OwnershipService } = await import('./services/ownership.service.js');
        const ownershipService = di_1.Container.get(OwnershipService);
        const project = await ownershipService.getWorkflowProjectCached(additionalData.workflowId);
        projectId = project.id;
    }
    if (!projectId) {
        throw new n8n_workflow_1.UnexpectedError('Cannot execute agent without a projectId or workflowId in additional data');
    }
    const { AgentWorkflowExecutionService } = await import('./modules/agents/agent-workflow-execution.service.js');
    const agentWorkflowExecutionService = di_1.Container.get(AgentWorkflowExecutionService);
    const streamObserver = invocationContext
        ? (0, workflow_agent_stream_1.createWorkflowAgentStreamObserver)({
            additionalData,
            executionId,
            invocation: invocationContext,
        })
        : undefined;
    const runOptions = streamObserver || prepareForEval ? [{ streamObserver, prepareForEval }] : [];
    if (!additionalData.workflowId) {
        throw new n8n_workflow_1.UnexpectedError('Cannot execute agent without a workflowId in additional data');
    }
    const scopedThreadId = `workflow:project-${projectId}:${threadId}`;
    const useDraftVersion = prepareForEval !== undefined || (0, execution_utils_1.isManualOrChatExecution)(executionMode);
    if (source.inlineAgent) {
        return await agentWorkflowExecutionService.executeInlineForWorkflow(source.inlineAgent, message, executionId, scopedThreadId, projectId, telemetryUserId, useDraftVersion ? 'test' : 'production', outputSchema, workflowContext, ...runOptions);
    }
    const { hashAgentSandboxPrincipal } = await import('./modules/agents/agent-sandbox-principal.js');
    const sandboxScope = workflowContext?.hasCallerSessionId === true
        ? {
            principalHash: hashAgentSandboxPrincipal({
                type: 'project-session',
                projectId,
                sessionId: threadId,
            }),
        }
        : {
            principalHash: hashAgentSandboxPrincipal({
                type: 'workflow-execution',
                workflowId: additionalData.workflowId,
                executionId,
            }),
        };
    const result = await agentWorkflowExecutionService.executeForWorkflow(source.agentId, message, executionId, scopedThreadId, projectId, telemetryUserId, useDraftVersion, outputSchema, workflowContext, sandboxScope, ...runOptions);
    return result.session
        ? { ...result, session: { ...result.session, sessionId: threadId } }
        : result;
}
async function listAgents(userId) {
    assertAgentsModuleActive();
    const { AgentsSettingsService } = await import('./modules/agents/agents-settings.service.js');
    await di_1.Container.get(AgentsSettingsService).assertEnabled();
    const { AgentsService } = await import('./modules/agents/agents.service.js');
    const agentsService = di_1.Container.get(AgentsService);
    const agents = await agentsService.findByUser(userId);
    return agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
    }));
}
function triggerReturnsLastRunOnly(nodes) {
    const trigger = nodes.find((node) => node.type === 'n8n-nodes-base.executeWorkflowTrigger');
    const triggerVersion = trigger?.typeVersion ?? 1;
    return triggerVersion < 1.2 && trigger?.parameters?.returnOutput !== 'allRuns';
}
function buildSubWorkflowOutput(data, workflowNodes, callerReturnsLastRunOnly) {
    const lastRunOnly = callerReturnsLastRunOnly || triggerReturnsLastRunOnly(workflowNodes);
    const runs = WorkflowHelpers.getLastExecutedNodeRuns(data);
    const { lastNodeExecuted, pinData = {} } = data.data.resultData;
    const manualPinDataOverride = data.mode === 'manual' &&
        lastNodeExecuted !== undefined &&
        pinData[lastNodeExecuted] !== undefined;
    if (!lastRunOnly && runs.length > 0 && !manualPinDataOverride) {
        return (0, n8n_workflow_1.mergeRunsPerBranch)(runs);
    }
    return WorkflowHelpers.getLastExecutedNodeData(data)?.data?.main ?? [null];
}
async function startExecution(additionalData, options, executionId, runData, workflowData, isInlineSubworkflow = false) {
    const nodeTypes = di_1.Container.get(node_types_1.NodeTypes);
    const activeExecutions = di_1.Container.get(active_executions_1.ActiveExecutions);
    const executionRepository = di_1.Container.get(db_1.ExecutionRepository);
    const workflowName = workflowData ? workflowData.name : undefined;
    const workflow = new n8n_workflow_1.Workflow({
        id: workflowData.id,
        name: workflowName,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        active: workflowData.activeVersionId !== null,
        nodeTypes,
        staticData: workflowData.staticData,
        settings: workflowData.settings,
    });
    const startTime = Date.now();
    const workflowCredentialIds = (0, credential_sharing_1.isCredSharingEnabled)()
        ? di_1.Container.get(pre_execution_checks_1.CredentialsPermissionChecker).getCredentialIdsForNodes(workflowData.nodes)
        : [];
    let hooks;
    let callerAllowed = false;
    let credentialChecksPassed = false;
    let data;
    try {
        await executionRepository.setRunning(executionId);
        hooks = (0, execution_lifecycle_hooks_1.getLifecycleHooksForSubExecutions)(runData.executionMode, executionId, workflowData, additionalData.userId, options.parentExecution);
        const rootExecutionMode = additionalData.rootExecutionMode ?? options.executionMode;
        await di_1.Container.get(pre_execution_checks_1.SubworkflowPolicyChecker).check(workflow, options.parentWorkflowId, options.node, additionalData.userId);
        callerAllowed = true;
        if (isInlineSubworkflow && additionalData.userId && isUserInitiated(rootExecutionMode)) {
            await di_1.Container.get(pre_execution_checks_1.CredentialsPermissionChecker).checkForUser(additionalData.userId, workflowData.nodes);
        }
        else {
            await di_1.Container.get(pre_execution_checks_1.CredentialsPermissionChecker).check(workflowData.id, workflowData.nodes, additionalData.userId);
        }
        credentialChecksPassed = true;
        const workflowSettings = workflowData.settings;
        const additionalDataIntegrated = await getBase({
            userId: additionalData.userId,
            workflowId: workflowData.id,
            workflowSettings,
        });
        additionalDataIntegrated.hooks = hooks;
        additionalDataIntegrated.executionId = executionId;
        additionalDataIntegrated.parentCallbackManager = options.parentCallbackManager;
        additionalDataIntegrated.executeWorkflow = additionalData.executeWorkflow;
        additionalDataIntegrated.executeAgent = additionalData.executeAgent;
        additionalDataIntegrated.listAgents = additionalData.listAgents;
        additionalDataIntegrated.rootExecutionMode =
            additionalData.rootExecutionMode ?? options.executionMode;
        additionalDataIntegrated.evaluationRunId = additionalData.evaluationRunId;
        if (additionalData.httpResponse) {
            additionalDataIntegrated.httpResponse = additionalData.httpResponse;
        }
        additionalDataIntegrated.streamingEnabled = additionalData.streamingEnabled;
        const executionsConfig = di_1.Container.get(config_1.ExecutionsConfig);
        const subworkflowDeadline = resolveSubworkflowDeadline(determineWorkflowDeadline(startTime, workflowSettings, executionsConfig), additionalData.executionTimeoutTimestamp, options.doNotWaitToFinish);
        additionalDataIntegrated.executionTimeoutTimestamp = subworkflowDeadline;
        const runExecutionData = runData.executionData;
        const workflowExecute = new n8n_core_1.WorkflowExecute(additionalDataIntegrated, runData.executionMode, runExecutionData, di_1.Container.get(n8n_core_1.StorageConfig).modeTag);
        const execution = workflowExecute.processRunExecutionData(workflow);
        activeExecutions.attachWorkflowExecution(executionId, execution);
        data = await execution;
    }
    catch (error) {
        const executionError = error;
        const fullRunData = di_1.Container.get(failed_run_factory_1.FailedRunFactory).generateFailedExecutionFromError(runData.executionMode, executionError, 'node' in executionError ? executionError.node : undefined, startTime);
        const fullExecutionData = {
            data: fullRunData.data,
            mode: fullRunData.mode,
            finished: fullRunData.finished ? fullRunData.finished : false,
            startedAt: fullRunData.startedAt,
            stoppedAt: fullRunData.stoppedAt,
            status: fullRunData.status,
            workflowData,
            workflowId: workflowData.id,
        };
        if (workflowData.id) {
            fullExecutionData.workflowId = workflowData.id;
        }
        activeExecutions.finalizeExecution(executionId, fullRunData);
        const logUnrecordedFailure = (recordError) => di_1.Container.get(backend_common_1.Logger).error('Failed to record a failed sub-workflow execution', {
            executionId,
            workflowId: workflowData.id,
            error: recordError,
        });
        try {
            if (hooks && callerAllowed && !credentialChecksPassed) {
                await hooks
                    .runHook('workflowExecuteBefore', [undefined, runData.executionData])
                    .catch((hookError) => di_1.Container.get(backend_common_1.Logger).warn('A before hook failed for a failed sub-workflow execution', {
                    executionId,
                    workflowId: workflowData.id,
                    error: hookError,
                }));
                await hooks
                    .runHook('workflowExecuteAfter', [fullRunData])
                    .catch(async (hookError) => {
                    di_1.Container.get(backend_common_1.Logger).warn('An after hook failed for a failed sub-workflow execution', {
                        executionId,
                        workflowId: workflowData.id,
                        error: hookError,
                    });
                    await di_1.Container.get(execution_persistence_1.ExecutionPersistence).updateExistingExecution(executionId, fullExecutionData);
                });
            }
            else {
                await di_1.Container.get(execution_persistence_1.ExecutionPersistence).updateExistingExecution(executionId, fullExecutionData);
            }
        }
        catch (recordError) {
            logUnrecordedFailure(recordError);
        }
        throw (0, n8n_workflow_1.attachSubWorkflowRedaction)((0, n8n_workflow_1.attachDynamicCredentialsUsage)((0, object_to_error_1.objectToError)({
            ...executionError,
            executionId,
            workflowId: workflowData.id,
            stack: executionError?.stack,
            message: executionError?.message,
        }, workflow), (0, n8n_workflow_1.summarizeDynamicCredentialsUsage)(runData.executionData, workflowCredentialIds)), (0, n8n_workflow_1.summarizeSubWorkflowRedaction)(runData.executionData, { includeOwn: true }));
    }
    if (data.finished === true || data.status === 'waiting') {
        activeExecutions.finalizeExecution(executionId, data);
        return {
            executionId,
            data: data.data.subWorkflowOutput
                ? await (0, n8n_workflow_1.collectSubWorkflowOutput)(data, workflow, data.data.subWorkflowOutput)
                : buildSubWorkflowOutput(data, workflowData.nodes, options.returnLastRunOnly ?? false),
            waitTill: data.waitTill,
            ...(0, n8n_workflow_1.summarizeDynamicCredentialsUsage)(data.data, workflowCredentialIds),
            subWorkflowRedaction: (0, n8n_workflow_1.summarizeSubWorkflowRedaction)(data.data, { includeOwn: true }),
        };
    }
    activeExecutions.finalizeExecution(executionId, data);
    const { error } = data.data.resultData;
    throw (0, n8n_workflow_1.attachSubWorkflowRedaction)((0, n8n_workflow_1.attachDynamicCredentialsUsage)((0, object_to_error_1.objectToError)({
        ...error,
        executionId,
        workflowId: workflowData.id,
        stack: error?.stack,
    }, workflow), (0, n8n_workflow_1.summarizeDynamicCredentialsUsage)(data.data, workflowCredentialIds)), (0, n8n_workflow_1.summarizeSubWorkflowRedaction)(data.data, { includeOwn: true }));
}
function setExecutionStatus(status) {
    const logger = di_1.Container.get(backend_common_1.Logger);
    if (this.executionId === undefined) {
        logger.debug(`Setting execution status "${status}" failed because executionId is undefined`);
        return;
    }
    logger.debug(`Setting execution status for ${this.executionId} to "${status}"`);
    di_1.Container.get(active_executions_1.ActiveExecutions).setStatus(this.executionId, status);
}
function sendDataToUI(type, data) {
    const { pushRef } = this;
    if (pushRef === undefined) {
        return;
    }
    try {
        const pushInstance = di_1.Container.get(push_1.Push);
        pushInstance.send({ type, data }, pushRef);
    }
    catch (error) {
        const logger = di_1.Container.get(backend_common_1.Logger);
        logger.warn(`There was a problem sending message to UI: ${error.message}`);
    }
}
function isUserInitiated(executionMode) {
    if (!executionMode)
        return false;
    return ['manual', 'chat', 'retry', 'evaluation'].includes(executionMode);
}
async function getBase({ userId, workflowId, projectId, currentNodeParameters, executionTimeoutTimestamp, workflowSettings, } = {}) {
    const urlService = di_1.Container.get(backend_services_1.UrlService);
    const urlBaseWebhook = urlService.getWebhookBaseUrl();
    const urlBaseTestWebhook = urlService.getTestWebhookBaseUrl();
    const instanceBaseUrl = urlService.getInstanceBaseUrl();
    const globalConfig = di_1.Container.get(config_1.GlobalConfig);
    if (!projectId && workflowId) {
        const { OwnershipService } = await import('./services/ownership.service.js');
        const project = await di_1.Container.get(OwnershipService).getWorkflowProjectCached(workflowId);
        projectId = project?.id;
    }
    const variables = await WorkflowHelpers.getVariables(workflowId, projectId);
    const eventService = di_1.Container.get(backend_services_1.EventService);
    const additionalData = {
        currentNodeExecutionIndex: 0,
        credentialsHelper: di_1.Container.get(credentials_helper_1.CredentialsHelper),
        executeWorkflow,
        executeAgent,
        listAgents,
        restApiUrl: urlBaseWebhook + globalConfig.endpoints.rest,
        instanceBaseUrl: `${instanceBaseUrl}/`,
        formWaitingBaseUrl: urlBaseWebhook + globalConfig.endpoints.formWaiting,
        formBaseUrl: urlBaseWebhook + globalConfig.endpoints.form,
        formTestBaseUrl: urlBaseTestWebhook + globalConfig.endpoints.formTest,
        webhookBaseUrl: urlBaseWebhook + globalConfig.endpoints.webhook,
        webhookWaitingBaseUrl: urlBaseWebhook + globalConfig.endpoints.webhookWaiting,
        webhookTestBaseUrl: urlBaseTestWebhook + globalConfig.endpoints.webhookTest,
        mcpBaseUrl: urlBaseWebhook + globalConfig.endpoints.mcp,
        mcpTestBaseUrl: urlBaseTestWebhook + globalConfig.endpoints.mcpTest,
        currentNodeParameters,
        executionTimeoutTimestamp,
        userId,
        workflowId,
        projectId,
        setExecutionStatus,
        variables,
        workflowSettings,
        async getRuntimeCredential(runExecutionData, alias) {
            return await di_1.Container.get(backend_services_1.RuntimeCredentialProxyService).getRuntimeCredential(runExecutionData, alias);
        },
        async getRunExecutionData(executionId) {
            const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
            const executionData = await executionPersistence.findSingleExecution(executionId, {
                unflattenData: true,
                includeData: true,
            });
            return executionData?.data;
        },
        externalSecretsProxy: di_1.Container.get(n8n_core_1.ExternalSecretsProxy),
        async startRunnerTask(additionalData, jobType, settings, executeFunctions, inputData, node, workflow, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, siblingParameters, mode, envProviderState, executeData) {
            return await di_1.Container.get(task_requester_1.TaskRequester).startTask(additionalData, jobType, settings, executeFunctions, inputData, node, workflow, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, siblingParameters, mode, envProviderState, executeData);
        },
        logAiEvent: (eventName, payload) => {
            eventService.emit(eventName, payload);
        },
        logHitlResponse: (payload) => {
            eventService.emit('hitl-response-actioned', payload);
        },
        getRunnerStatus: (taskType) => di_1.Container.get(task_requester_1.TaskRequester).getRunnerStatus(taskType),
    };
    const ssrfConfig = di_1.Container.get(config_1.SsrfProtectionConfig);
    if (ssrfConfig.enabled) {
        additionalData.ssrfBridge = di_1.Container.get(backend_network_1.SsrfProtectionService);
    }
    for (const [moduleName, moduleContext] of di_1.Container.get(backend_common_1.ModuleRegistry).context.entries()) {
        additionalData[moduleName] = moduleContext;
    }
    return additionalData;
}
//# sourceMappingURL=workflow-execute-additional-data.js.map