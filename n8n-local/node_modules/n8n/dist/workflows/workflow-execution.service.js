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
exports.WorkflowExecutionService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const execution_already_resuming_error_1 = require("../errors/execution-already-resuming.error");
const pre_execute_blocked_error_1 = require("../errors/pre-execute-blocked.error");
const errors_1 = require("@n8n/errors");
const execution_crash_service_1 = require("../executions/execution-crash.service");
const execution_persistence_1 = require("../executions/execution-persistence");
const failed_run_factory_1 = require("../executions/failed-run-factory");
const pre_execution_checks_1 = require("../executions/pre-execution-checks");
const node_types_1 = require("../node-types");
const ownership_service_1 = require("../services/ownership.service");
const test_webhooks_1 = require("../webhooks/test-webhooks");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const workflow_runner_1 = require("../workflow-runner");
const poll_cursor_service_1 = require("../workflows/triggers/poll-cursor.service");
const utils_1 = require("../workflows/utils");
let WorkflowExecutionService = class WorkflowExecutionService {
    constructor(logger, errorReporter, executionPersistence, workflowRepository, nodeTypes, testWebhooks, workflowRunner, globalConfig, subworkflowPolicyChecker, failedRunFactory, eventService, ownershipService, executionContextService, workflowsConfig, workflowPublishedDataService, pollCursorService, executionCrashService, instanceWriteAccess) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.executionPersistence = executionPersistence;
        this.workflowRepository = workflowRepository;
        this.nodeTypes = nodeTypes;
        this.testWebhooks = testWebhooks;
        this.workflowRunner = workflowRunner;
        this.globalConfig = globalConfig;
        this.subworkflowPolicyChecker = subworkflowPolicyChecker;
        this.failedRunFactory = failedRunFactory;
        this.eventService = eventService;
        this.ownershipService = ownershipService;
        this.executionContextService = executionContextService;
        this.workflowsConfig = workflowsConfig;
        this.workflowPublishedDataService = workflowPublishedDataService;
        this.pollCursorService = pollCursorService;
        this.executionCrashService = executionCrashService;
        this.instanceWriteAccess = instanceWriteAccess;
    }
    async runWorkflow(workflowData, node, data, additionalData, mode, responsePromise, deduplicationKey, callerAwaitsOutcome = 'none') {
        const nodeExecutionStack = [
            {
                node,
                data: {
                    main: data,
                },
                source: null,
            },
        ];
        const executionData = (0, n8n_workflow_1.createRunExecutionData)({
            executionData: {
                nodeExecutionStack,
            },
        });
        const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, workflowData.id);
        const runData = {
            userId: additionalData.userId,
            executionMode: mode,
            executionData,
            workflowData,
            deduplicationKey,
            projectId,
            projectName,
            callerAwaitsOutcome,
        };
        return await this.workflowRunner.run(runData, true, undefined, undefined, responsePromise);
    }
    async runPolledWorkflow(workflowData, node, data, additionalData, mode, cursor, responsePromise, fence, callerAwaitsOutcome = 'none') {
        const nodeExecutionStack = [
            {
                node,
                data: {
                    main: data,
                },
                source: null,
            },
        ];
        const executionData = (0, n8n_workflow_1.createRunExecutionData)({
            executionData: {
                nodeExecutionStack,
            },
        });
        const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, workflowData.id);
        const runData = {
            userId: additionalData.userId,
            executionMode: mode,
            executionData,
            workflowData,
            projectId,
            projectName,
            callerAwaitsOutcome,
        };
        const establishContextError = await this.workflowRunner.establishContextForPersistence(runData);
        if (establishContextError) {
            this.errorReporter.error(establishContextError, { shouldBeLogged: false });
            this.logger.error('Failed to prepare a polled execution, so its cursor was not committed', {
                workflowId: workflowData.id,
                nodeName: node.name,
                error: establishContextError,
            });
            responsePromise?.reject((0, ensure_error_1.ensureError)(establishContextError));
            return undefined;
        }
        try {
            await this.workflowRunner.prepareNewExecution(runData, true);
        }
        catch (error) {
            if (error instanceof pre_execute_blocked_error_1.PreExecuteBlockedError) {
                this.logger.error('Blocked a polled execution before its row was committed', {
                    workflowId: workflowData.id,
                    nodeName: node.name,
                    error: error.cause,
                });
                responsePromise?.reject(error.cause);
                return undefined;
            }
            throw error;
        }
        const payload = {
            data: executionData,
            mode,
            finished: false,
            workflowData,
            status: 'new',
            workflowId: workflowData.id,
            retryOf: runData.retryOf ?? undefined,
            tracingContext: runData.tracingContext ?? null,
        };
        const commitResult = await this.pollCursorService.commitWithExecution({
            workflowId: workflowData.id,
            nodeId: node.id,
            cursor,
            payload,
            fence,
        });
        if (commitResult === null) {
            this.logger.debug('Poll cursor commit skipped: the poll no longer holds its lease', {
                workflowId: workflowData.id,
                nodeId: node.id,
                nodeName: node.name,
            });
            responsePromise?.reject(new n8n_workflow_1.OperationalError('Poll cursor commit skipped: the poll no longer holds its lease'));
            return undefined;
        }
        const { executionId } = commitResult;
        try {
            await this.workflowRunner.run(runData, false, undefined, { executionId, expectedStatus: 'new' }, responsePromise);
        }
        catch (error) {
            if (error instanceof execution_already_resuming_error_1.ExecutionAlreadyResumingError) {
                this.logger.debug('Polled execution was already claimed, leaving it to its owner', {
                    executionId,
                });
            }
            else {
                await this.crashFailedPolledExecution(executionId, error, responsePromise);
            }
        }
        return executionId;
    }
    async runPolledWorkflowV2(workflowData, node, data, additionalData, mode, cursor, responsePromise, fence) {
        const executionId = await this.runWorkflow(workflowData, node, data, additionalData, mode, responsePromise);
        const committed = await this.pollCursorService.commitCursorOnly({
            workflowId: workflowData.id,
            nodeId: node.id,
            cursor,
            fence,
        });
        if (!committed) {
            this.logger.warn('Poll cursor commit skipped after its execution already started: the poll no longer holds its lease', { workflowId: workflowData.id, nodeId: node.id, nodeName: node.name, executionId });
        }
        return executionId;
    }
    async crashFailedPolledExecution(executionId, error, responsePromise) {
        this.errorReporter.error(error, { executionId, shouldBeLogged: false });
        this.logger.error('Failed to start the execution committed for a poll', {
            executionId,
            error,
        });
        responsePromise?.reject((0, ensure_error_1.ensureError)(error));
        await this.executionCrashService.markAsCrashed(executionId, 'start-failure');
    }
    isDestinationNodeATrigger(destinationNode, workflow) {
        const node = workflow.nodes.find((n) => n.name === destinationNode);
        if (node === undefined) {
            return false;
        }
        const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        return nodeType.description.group.includes('trigger');
    }
    async executeManually(workflowData, payload, user, pushRef, n8nAuthCookie) {
        this.assertManualExecutionAllowed();
        const workflowIsActive = await this.workflowRepository.isActive(workflowData.id);
        workflowData.active = false;
        workflowData.activeVersionId = null;
        if ('triggerToStartFrom' in payload && payload.triggerToStartFrom !== undefined) {
            Reflect.deleteProperty(payload, 'runData');
        }
        let data;
        if (isPartialExecution(payload)) {
            if (this.partialExecutionFulfilsPreconditions(workflowData, payload)) {
                data = {
                    destinationNode: payload.destinationNode,
                    executionMode: 'manual',
                    runData: payload.runData,
                    pinData: workflowData.pinData,
                    pushRef,
                    workflowData,
                    userId: user.id,
                    dirtyNodeNames: payload.dirtyNodeNames,
                    agentRequest: payload.agentRequest,
                };
            }
            else {
                payload = upgradeToFullManualExecutionFromUnknownTrigger(payload);
            }
        }
        if (isFullExecutionFromKnownTrigger(payload)) {
            if ((payload.chatSessionId || triggerHasNoPinnedData(workflowData, payload)) &&
                (await this.testWebhooks.needsWebhook({
                    userId: user.id,
                    workflowEntity: workflowData,
                    additionalData: await WorkflowExecuteAdditionalData.getBase({
                        userId: user.id,
                        workflowId: workflowData.id,
                    }),
                    pushRef,
                    triggerToStartFrom: payload.triggerToStartFrom,
                    destinationNode: payload.destinationNode,
                    chatSessionId: payload.chatSessionId,
                    workflowIsActive,
                    n8nAuthCookie,
                }))) {
                return { waitingForWebhook: true };
            }
            data = {
                executionMode: 'manual',
                pinData: workflowData.pinData,
                pushRef,
                workflowData,
                userId: user.id,
                triggerToStartFrom: payload.triggerToStartFrom,
                agentRequest: payload.agentRequest,
                destinationNode: payload.destinationNode,
            };
        }
        if (isFullExecutionFromUnknownTrigger(payload)) {
            const pinnedTrigger = this.selectPinnedTrigger(workflowData, payload.destinationNode.nodeName, workflowData.pinData ?? {});
            if (pinnedTrigger === undefined &&
                (await this.testWebhooks.needsWebhook({
                    userId: user.id,
                    workflowEntity: workflowData,
                    additionalData: await WorkflowExecuteAdditionalData.getBase({
                        userId: user.id,
                        workflowId: workflowData.id,
                    }),
                    pushRef,
                    destinationNode: payload.destinationNode,
                    workflowIsActive,
                    n8nAuthCookie,
                }))) {
                return { waitingForWebhook: true };
            }
            data = {
                executionMode: 'manual',
                pinData: workflowData.pinData,
                pushRef,
                workflowData,
                userId: user.id,
                agentRequest: payload.agentRequest,
                destinationNode: payload.destinationNode,
                triggerToStartFrom: pinnedTrigger ? { name: pinnedTrigger.name } : undefined,
            };
        }
        if (data) {
            const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, workflowData.id);
            data.projectId = projectId;
            data.projectName = projectName;
            data.encryptedRunnerIdentity = n8nAuthCookie
                ? await this.executionContextService.buildManualExecutionCredentials(n8nAuthCookie)
                : undefined;
            const offloadingManualExecutionsInQueueMode = this.globalConfig.executions.mode === 'queue' &&
                process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS === 'true';
            if (data.executionMode === 'manual' && offloadingManualExecutionsInQueueMode) {
                data.executionData = (0, n8n_workflow_1.createRunExecutionData)({
                    startData: {
                        startNodes: data.startNodes,
                        destinationNode: data.destinationNode,
                    },
                    resultData: {
                        pinData: data.pinData,
                        runData: data.runData ?? null,
                    },
                    manualData: {
                        userId: data.userId,
                        dirtyNodeNames: data.dirtyNodeNames,
                        triggerToStartFrom: data.triggerToStartFrom,
                        agentRequest: data.agentRequest,
                        source: data.source,
                    },
                    executionData: null,
                });
            }
            const executionId = await this.workflowRunner.run(data);
            return { executionId };
        }
        throw new n8n_workflow_1.UnexpectedError('`executeManually` was called with an unexpected payload', {
            extra: { payload },
        });
    }
    async executeChatWorkflow(user, workflowData, executionData, httpResponse, streamingEnabled, executionMode = 'chat', pushRef) {
        const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, workflowData.id);
        const data = {
            userId: user.id,
            executionMode,
            workflowData,
            executionData,
            streamingEnabled,
            httpResponse,
            pushRef,
            projectId,
            projectName,
        };
        const executionId = await this.workflowRunner.run(data, undefined, true);
        this.eventService.emit('workflow-executed', {
            user: { id: user.id },
            workflowId: workflowData.id,
            workflowName: workflowData.name,
            executionId,
            projectId,
            projectName,
            source: 'chat',
        });
        return {
            executionId,
        };
    }
    async loadErrorWorkflowData(workflowId, workflowErrorData) {
        const notActiveError = `Calling Error Workflow for "${workflowErrorData.workflow.id}". Workflow "${workflowId}" is not active and cannot be executed`;
        if (this.workflowsConfig.useWorkflowPublicationService) {
            const publishedData = await this.workflowPublishedDataService.getPublishedWorkflowData(workflowId);
            if (publishedData === null) {
                this.logger.error(notActiveError, { workflowId });
                return null;
            }
            const workflowData = publishedData.workflow;
            workflowData.nodes = publishedData.publishedVersion.nodes;
            workflowData.connections = publishedData.publishedVersion.connections;
            return workflowData;
        }
        const loaded = await this.workflowRepository.get({ id: workflowId }, { relations: ['activeVersion'] });
        if (loaded === null) {
            this.logger.error(`Calling Error Workflow for "${workflowErrorData.workflow.id}". Could not find workflow "${workflowId}"`, { workflowId });
            return null;
        }
        if (loaded.activeVersion === null) {
            this.logger.error(notActiveError, { workflowId });
            return null;
        }
        loaded.nodes = loaded.activeVersion.nodes;
        loaded.connections = loaded.activeVersion.connections;
        return loaded;
    }
    async executeErrorWorkflow(workflowId, workflowErrorData, runningProject) {
        try {
            const executionMode = 'error';
            const workflowData = await this.loadErrorWorkflowData(workflowId, workflowErrorData);
            if (workflowData === null)
                return;
            const workflowInstance = new n8n_workflow_1.Workflow({
                id: workflowId,
                name: workflowData.name,
                nodeTypes: this.nodeTypes,
                nodes: workflowData.nodes,
                connections: workflowData.connections,
                active: true,
                staticData: workflowData.staticData,
                settings: workflowData.settings,
            });
            try {
                const failedNode = workflowErrorData.execution?.lastNodeExecuted
                    ? workflowInstance.getNode(workflowErrorData.execution?.lastNodeExecuted)
                    : undefined;
                await this.subworkflowPolicyChecker.check(workflowInstance, workflowErrorData.workflow.id, failedNode ?? undefined);
            }
            catch (error) {
                const initialNode = workflowInstance.getStartNode();
                if (initialNode) {
                    const errorWorkflowPermissionError = new n8n_workflow_1.SubworkflowOperationError(`Another workflow: (ID ${workflowErrorData.workflow.id}) tried to invoke this workflow to handle errors.`, "Unfortunately current permissions do not allow this. Please check that this workflow's settings allow it to be called by others");
                    const fakeExecution = this.failedRunFactory.generateFailedExecutionFromError('error', errorWorkflowPermissionError, initialNode);
                    const fullExecutionData = {
                        data: fakeExecution.data,
                        mode: fakeExecution.mode,
                        finished: false,
                        stoppedAt: new Date(),
                        workflowData,
                        waitTill: null,
                        status: fakeExecution.status,
                        workflowId: workflowData.id,
                    };
                    await this.executionPersistence.create(fullExecutionData);
                }
                this.logger.info('Error workflow execution blocked due to subworkflow settings', {
                    erroredWorkflowId: workflowErrorData.workflow.id,
                    errorWorkflowId: workflowId,
                });
                return;
            }
            let node;
            let workflowStartNode;
            const { errorTriggerType } = this.globalConfig.nodes;
            for (const nodeName of Object.keys(workflowInstance.nodes)) {
                node = workflowInstance.nodes[nodeName];
                if (node.type === errorTriggerType) {
                    workflowStartNode = node;
                }
            }
            if (workflowStartNode === undefined) {
                this.logger.error(`Calling Error Workflow for "${workflowErrorData.workflow.id}". Could not find "${errorTriggerType}" in workflow "${workflowId}"`);
                return;
            }
            const parentExecution = workflowErrorData.execution?.id && workflowErrorData.workflow?.id
                ? {
                    executionId: workflowErrorData.execution.id,
                    workflowId: workflowErrorData.workflow.id,
                    executionContext: workflowErrorData.execution.executionContext,
                    shouldResume: false,
                }
                : undefined;
            const nodeExecutionStack = [];
            nodeExecutionStack.push({
                node: workflowStartNode,
                data: {
                    main: [
                        [
                            {
                                json: workflowErrorData,
                            },
                        ],
                    ],
                },
                source: null,
                ...(parentExecution && {
                    metadata: {
                        parentExecution,
                    },
                }),
            });
            const runExecutionData = (0, n8n_workflow_1.createRunExecutionData)({
                executionData: {
                    nodeExecutionStack,
                },
                parentExecution,
            });
            const runData = {
                executionMode,
                executionData: runExecutionData,
                workflowData,
                projectId: runningProject.id,
                projectName: runningProject.name,
            };
            const executionId = await this.workflowRunner.run(runData);
            this.eventService.emit('workflow-executed', {
                workflowId,
                workflowName: workflowData.name,
                executionId,
                projectId: runningProject.id,
                projectName: runningProject.name,
                source: 'error',
            });
        }
        catch (error) {
            this.errorReporter.error(error);
            this.logger.error(`Calling Error Workflow for "${workflowErrorData.workflow.id}": "${error.message}"`, { workflowId: workflowErrorData.workflow.id });
        }
    }
    selectPinnedTrigger(workflow, destinationNode, pinData) {
        const allPinnedTriggers = this.findAllPinnedTriggers(workflow, pinData);
        if (allPinnedTriggers.length === 0)
            return undefined;
        const destinationParents = new Set(new n8n_workflow_1.Workflow({
            nodes: workflow.nodes,
            connections: workflow.connections,
            active: workflow.activeVersionId !== null,
            nodeTypes: this.nodeTypes,
        }).getParentNodes(destinationNode));
        const trigger = allPinnedTriggers.find((a) => destinationParents.has(a.name));
        return trigger;
    }
    findAllPinnedTriggers(workflow, pinData) {
        return workflow.nodes
            .filter((node) => !node.disabled &&
            pinData?.[node.name] &&
            ['trigger', 'webhook'].some((suffix) => node.type.toLowerCase().endsWith(suffix)) &&
            node.type !== 'n8n-nodes-base.respondToWebhook')
            .sort((a) => (a.type.endsWith('webhook') ? -1 : 1));
    }
    partialExecutionFulfilsPreconditions(workflowData, payload) {
        if (this.isDestinationNodeATrigger(payload.destinationNode.nodeName, workflowData)) {
            return false;
        }
        return (0, n8n_core_1.anyReachableRootHasRunData)(n8n_core_1.DirectedGraph.fromNodesAndConnections(workflowData.nodes, workflowData.connections), payload.destinationNode.nodeName, payload.runData);
    }
    assertManualExecutionAllowed() {
        if (this.instanceWriteAccess.isReadOnly()) {
            throw new errors_1.ForbiddenError('Cannot run workflows manually on a protected instance. This instance is in read-only mode.');
        }
    }
};
exports.WorkflowExecutionService = WorkflowExecutionService;
exports.WorkflowExecutionService = WorkflowExecutionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, execution_persistence_1.ExecutionPersistence, db_1.WorkflowRepository, node_types_1.NodeTypes, test_webhooks_1.TestWebhooks, workflow_runner_1.WorkflowRunner, config_1.GlobalConfig, pre_execution_checks_1.SubworkflowPolicyChecker, failed_run_factory_1.FailedRunFactory, backend_services_1.EventService, ownership_service_1.OwnershipService, n8n_core_1.ExecutionContextService, config_1.WorkflowsConfig, backend_services_1.WorkflowPublishedDataService, poll_cursor_service_1.PollCursorService, execution_crash_service_1.ExecutionCrashService, backend_services_1.InstanceWriteAccessService])
], WorkflowExecutionService);
function isPartialExecution(payload) {
    return ('runData' in payload && payload.runData !== undefined && payload.destinationNode !== undefined);
}
function isFullExecutionFromKnownTrigger(payload) {
    return 'triggerToStartFrom' in payload && payload.triggerToStartFrom !== undefined;
}
function isFullExecutionFromUnknownTrigger(payload) {
    if ('triggerToStartFrom' in payload && payload.triggerToStartFrom !== undefined) {
        return false;
    }
    if ('runData' in payload && payload.runData !== undefined) {
        return false;
    }
    return payload.destinationNode !== undefined;
}
function triggerHasNoPinnedData(workflowData, payload) {
    return workflowData.pinData?.[payload.triggerToStartFrom.name] === undefined;
}
function upgradeToFullManualExecutionFromUnknownTrigger(payload) {
    return {
        destinationNode: payload.destinationNode,
        agentRequest: payload.agentRequest,
    };
}
//# sourceMappingURL=workflow-execution.service.js.map