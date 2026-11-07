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
exports.WorkflowTriggerActivator = void 0;
const backend_services_1 = require("@n8n/backend-services");
const strict_1 = __importDefault(require("node:assert/strict"));
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const result_1 = require("@n8n/utils/result");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const activation_errors_service_1 = require("../../activation-errors.service");
const constants_1 = require("../../constants");
const node_types_1 = require("../../node-types");
const WorkflowExecuteAdditionalData = __importStar(require("../../workflow-execute-additional-data"));
const enabled_trigger_nodes_1 = require("../../workflows/triggers/enabled-trigger-nodes");
const non_webhook_trigger_registrar_1 = require("../../workflows/triggers/non-webhook-trigger-registrar");
const trigger_activation_retry_1 = require("../../workflows/triggers/trigger-activation-retry");
const trigger_count_service_1 = require("../../workflows/triggers/trigger-count.service");
const trigger_execution_context_factory_1 = require("../../workflows/triggers/trigger-execution-context.factory");
const webhook_trigger_registrar_1 = require("../../workflows/triggers/webhook-trigger-registrar");
const workflow_static_data_service_1 = require("../../workflows/workflow-static-data.service");
async function raceAbort(promise, abort) {
    const { signal } = abort;
    if (signal.aborted) {
        abort.onDetached(promise);
        throw (0, ensure_error_1.ensureError)(signal.reason);
    }
    let onAbort;
    const aborted = new Promise((_resolve, reject) => {
        onAbort = () => reject((0, ensure_error_1.ensureError)(signal.reason));
        signal.addEventListener('abort', onAbort, { once: true });
    });
    try {
        return await Promise.race([promise, aborted]);
    }
    catch (error) {
        if (signal.aborted)
            abort.onDetached(promise);
        throw error;
    }
    finally {
        signal.removeEventListener('abort', onAbort);
    }
}
const PSEUDO_TRIGGER_NODE_TYPES = new Set([
    n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE,
    n8n_workflow_1.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE,
    n8n_workflow_1.ERROR_TRIGGER_NODE_TYPE,
]);
let WorkflowTriggerActivator = class WorkflowTriggerActivator {
    constructor(logger, errorReporter, nodeTypes, workflowRepository, workflowStaticDataService, workflowsConfig, triggerExecutionContextFactory, webhookTriggerRegistrar, nonWebhookTriggerRegistrar, triggerCountService, activationErrorsService, tracing, eventService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.nodeTypes = nodeTypes;
        this.workflowRepository = workflowRepository;
        this.workflowStaticDataService = workflowStaticDataService;
        this.workflowsConfig = workflowsConfig;
        this.triggerExecutionContextFactory = triggerExecutionContextFactory;
        this.webhookTriggerRegistrar = webhookTriggerRegistrar;
        this.nonWebhookTriggerRegistrar = nonWebhookTriggerRegistrar;
        this.triggerCountService = triggerCountService;
        this.activationErrorsService = activationErrorsService;
        this.tracing = tracing;
        this.eventService = eventService;
        (0, strict_1.default)(this.workflowsConfig.useWorkflowPublicationService, 'WorkflowTriggerActivator requires workflow publication service to be enabled');
        this.logger = this.logger.scoped(['workflow-activation']);
    }
    getEnabledTriggerNodes(version) {
        return (0, enabled_trigger_nodes_1.getEnabledTriggerNodes)(version, this.nodeTypes);
    }
    getTriggerKinds(nodes) {
        const workflow = new n8n_workflow_1.Workflow({
            id: 'trigger-diff',
            name: 'trigger-diff',
            nodes,
            connections: {},
            active: false,
            nodeTypes: this.nodeTypes,
        });
        const inMemoryNodeIds = new Set([...workflow.getPollNodes(), ...workflow.getTriggerNodes()]
            .filter((node) => !PSEUDO_TRIGGER_NODE_TYPES.has(node.type))
            .map((node) => node.id));
        const kinds = new Map();
        for (const node of nodes) {
            kinds.set(node.id, inMemoryNodeIds.has(node.id) ? 'in-memory' : 'persisted');
        }
        return kinds;
    }
    getUnregisteredNonWebhookTriggerNodeIds(workflowId, desiredNodes) {
        const registered = this.nonWebhookTriggerRegistrar.getRegisteredTriggerNodeIds(workflowId);
        const unregistered = new Set();
        for (const nodeId of this.getNonWebhookTriggerNodeIds(desiredNodes)) {
            if (!registered.has(nodeId))
                unregistered.add(nodeId);
        }
        return unregistered;
    }
    async getNodesWithUnregisteredWebhooks(dbWorkflow, version) {
        const desiredNodes = new Set(this.getEnabledTriggerNodes(version).map((node) => node.id));
        if (desiredNodes.size === 0)
            return new Set();
        this.applyVersionToDbWorkflow(dbWorkflow, version);
        const workflow = this.createWorkflow(dbWorkflow);
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            workflowId: workflow.id,
            workflowSettings: dbWorkflow.settings,
        });
        return await this.webhookTriggerRegistrar.getNodesWithUnregisteredWebhooks(workflow, additionalData, desiredNodes);
    }
    getNonWebhookTriggerNodeIds(nodes) {
        const workflow = new n8n_workflow_1.Workflow({
            id: 'trigger-diff',
            name: 'trigger-diff',
            nodes,
            connections: {},
            active: false,
            nodeTypes: this.nodeTypes,
        });
        return [...workflow.getTriggerNodes(), ...workflow.getPollNodes()].map((node) => node.id);
    }
    async activate(dbWorkflow, version, nodeIds, activationMode, abort) {
        const startedAt = Date.now();
        try {
            const outcome = await this.activateInternal(dbWorkflow, version, nodeIds, activationMode, abort);
            this.emitTriggerOperation('activate', outcome.failures.length === 0 ? 'success' : 'failure', startedAt);
            this.emitTriggerNodeOperations('activate', outcome.activated.length, outcome.failures.length);
            return outcome;
        }
        catch (error) {
            this.emitTriggerOperation('activate', 'failure', startedAt);
            throw error;
        }
    }
    async activateInternal(dbWorkflow, version, nodeIds, activationMode, abort) {
        return await this.tracing.startSpan({
            name: 'Trigger activation',
            op: 'publication.trigger.activate',
            attributes: {
                ...this.tracing.pickWorkflowAttributes(dbWorkflow),
                'n8n.publication.nodes_requested': nodeIds.size,
            },
        }, async (span) => {
            this.applyVersionToDbWorkflow(dbWorkflow, version);
            const workflow = this.createWorkflow(dbWorkflow);
            const additionalData = await WorkflowExecuteAdditionalData.getBase({
                workflowId: workflow.id,
                workflowSettings: dbWorkflow.settings,
            });
            const outcome = { activated: [], failures: [] };
            let triggerCount = 0;
            await workflow.expression.acquireIsolate();
            try {
                const resolveWorkflowData = this.createWorkflowDataResolver(dbWorkflow);
                const phaseResults = await Promise.allSettled([
                    this.registerWebhookTriggers(workflow, additionalData, nodeIds, outcome, activationMode, abort),
                    this.registerNonWebhookTriggers(dbWorkflow, workflow, additionalData, resolveWorkflowData, nodeIds, outcome, activationMode, abort),
                ]);
                this.throwRejectedPhaseError(phaseResults);
                triggerCount = this.triggerCountService.count(workflow, additionalData);
            }
            finally {
                await workflow.expression.releaseIsolate();
            }
            await Promise.all([
                this.workflowRepository.updateWorkflowTriggerCount(workflow.id, triggerCount),
                this.workflowStaticDataService.saveStaticData(workflow),
            ]);
            span.setAttributes({
                'n8n.publication.nodes_activated': outcome.activated.length,
                'n8n.publication.nodes_failed': outcome.failures.length,
                'n8n.publication.trigger_count': triggerCount,
            });
            span.setStatus({ code: 1 });
            return outcome;
        });
    }
    async deactivate(dbWorkflow, version, nodeIds, abort) {
        if (nodeIds.size === 0)
            return { externalTeardownFailures: [] };
        const startedAt = Date.now();
        try {
            const outcome = await this.deactivateInternal(dbWorkflow, version, nodeIds, abort);
            const failed = outcome.externalTeardownFailures.length;
            this.emitTriggerOperation('deactivate', 'success', startedAt);
            this.emitTriggerNodeOperations('deactivate', nodeIds.size - failed, failed);
            return outcome;
        }
        catch (error) {
            this.emitTriggerOperation('deactivate', 'failure', startedAt);
            this.emitTriggerNodeOperations('deactivate', 0, nodeIds.size);
            throw error;
        }
    }
    async deregisterUnresolvableNodes(workflowId, nodes, abort) {
        if (nodes.length === 0)
            return;
        await this.webhookTriggerRegistrar.clearWorkflowWebhooksForNodes(workflowId, nodes.map((node) => node.name));
        const results = await Promise.allSettled(nodes.map(async (node) => await raceAbort(this.nonWebhookTriggerRegistrar.deregister(workflowId, node.id, abort.onDetached), abort)));
        this.throwRejectedPhaseError(results);
    }
    async deactivateInternal(dbWorkflow, version, nodeIds, abort) {
        return await this.tracing.startSpan({
            name: 'Trigger deactivation',
            op: 'publication.trigger.deactivate',
            attributes: {
                ...this.tracing.pickWorkflowAttributes(dbWorkflow),
                'n8n.publication.nodes_requested': nodeIds.size,
            },
        }, async (span) => {
            this.applyVersionToDbWorkflow(dbWorkflow, version);
            const workflow = this.createWorkflow(dbWorkflow);
            const additionalData = await WorkflowExecuteAdditionalData.getBase({
                workflowId: workflow.id,
                workflowSettings: dbWorkflow.settings,
            });
            const [webhookPhase, nonWebhookPhase] = await Promise.allSettled([
                this.deregisterWebhookTriggers(workflow, additionalData, nodeIds, abort),
                this.deregisterNonWebhookTriggers(dbWorkflow.id, workflow, nodeIds, abort),
            ]);
            this.throwRejectedPhaseError([webhookPhase, nonWebhookPhase]);
            span.setStatus({ code: 1 });
            return {
                externalTeardownFailures: webhookPhase.status === 'fulfilled' ? webhookPhase.value : [],
            };
        });
    }
    async updateTriggerCount(dbWorkflow, version) {
        await this.tracing.startSpan({
            name: 'Trigger count update',
            op: 'publication.trigger.update_count',
            attributes: this.tracing.pickWorkflowAttributes(dbWorkflow),
        }, async (span) => {
            this.applyVersionToDbWorkflow(dbWorkflow, version);
            const workflow = this.createWorkflow(dbWorkflow);
            const additionalData = await WorkflowExecuteAdditionalData.getBase({
                workflowId: workflow.id,
                workflowSettings: dbWorkflow.settings,
            });
            let triggerCount = 0;
            await workflow.expression.acquireIsolate();
            try {
                triggerCount = this.triggerCountService.count(workflow, additionalData);
            }
            finally {
                await workflow.expression.releaseIsolate();
            }
            await this.workflowRepository.updateWorkflowTriggerCount(workflow.id, triggerCount);
            span.setAttribute('n8n.publication.trigger_count', triggerCount);
            span.setStatus({ code: 1 });
        });
    }
    emitTriggerOperation(operation, result, startedAt) {
        this.eventService.emit('workflow-publication-trigger-operation', {
            operation,
            result,
            durationMs: Date.now() - startedAt,
        });
    }
    emitTriggerNodeOperations(operation, successCount, failureCount) {
        if (successCount > 0) {
            this.eventService.emit('workflow-publication-trigger-node-operations', {
                operation,
                result: 'success',
                count: successCount,
            });
        }
        if (failureCount > 0) {
            this.eventService.emit('workflow-publication-trigger-node-operations', {
                operation,
                result: 'failure',
                count: failureCount,
            });
        }
    }
    applyVersionToDbWorkflow(dbWorkflow, version) {
        dbWorkflow.nodes = version.nodes;
        dbWorkflow.connections = version.connections;
    }
    createWorkflow(dbWorkflow) {
        return new n8n_workflow_1.Workflow({
            id: dbWorkflow.id,
            name: dbWorkflow.name,
            nodes: dbWorkflow.nodes,
            connections: dbWorkflow.connections,
            active: true,
            nodeTypes: this.nodeTypes,
            staticData: dbWorkflow.staticData,
            settings: dbWorkflow.settings,
        });
    }
    async registerWebhookTriggers(workflow, additionalData, nodeIds, outcome, activationMode, abort) {
        const webhooksByNode = this.groupWebhookTriggersByNode(workflow, additionalData, nodeIds);
        const tasks = [...webhooksByNode].map(async ([nodeId, { nodeName, webhooks }]) => await this.registerWebhookTriggersForNode(workflow, nodeId, nodeName, webhooks, activationMode, abort));
        for (const result of await Promise.all(tasks)) {
            if (result.ok)
                outcome.activated.push(result.result.nodeId);
            else
                outcome.failures.push(result.error);
        }
    }
    async registerWebhookTriggersForNode(workflow, nodeId, nodeName, webhooks, activationMode, abort) {
        try {
            for (const webhookData of webhooks) {
                await raceAbort((0, trigger_activation_retry_1.retryTriggerActivation)(async () => await this.webhookTriggerRegistrar.register({
                    workflow,
                    webhookData,
                    mode: 'trigger',
                    activation: activationMode,
                }), constants_1.TRIGGER_ACTIVATION_MAX_ATTEMPTS, abort.signal), abort);
            }
            return (0, result_1.createResultOk)({ nodeId });
        }
        catch (error) {
            return (0, result_1.createResultError)({ nodeId, nodeName, error: (0, ensure_error_1.ensureError)(error) });
        }
    }
    groupWebhookTriggersByNode(workflow, additionalData, nodeIds) {
        const grouped = new Map();
        for (const webhookData of this.getWebhookTriggersForNodeIds(workflow, additionalData, nodeIds)) {
            const nodeId = workflow.getNode(webhookData.node)?.id;
            if (!nodeId)
                continue;
            const entry = grouped.get(nodeId) ?? { nodeName: webhookData.node, webhooks: [] };
            entry.webhooks.push(webhookData);
            grouped.set(nodeId, entry);
        }
        return grouped;
    }
    async deregisterWebhookTriggers(workflow, additionalData, nodeIds, abort) {
        const failuresByNode = new Map();
        const targetNodeNames = Object.values(workflow.nodes)
            .filter((node) => nodeIds.has(node.id))
            .map((node) => node.name);
        await this.webhookTriggerRegistrar.clearWorkflowWebhooksForNodes(workflow.id, targetNodeNames);
        await workflow.expression.acquireIsolate();
        try {
            const webhooks = this.getNodeWebhooks(workflow, nodeIds, additionalData, failuresByNode);
            const deregistrationResults = await Promise.allSettled(webhooks.map(async (webhookData) => await this.deregisterExternalWebhookWithRetry(workflow, webhookData, abort)));
            for (const [index, result] of deregistrationResults.entries()) {
                if (result.status !== 'rejected')
                    continue;
                const error = (0, ensure_error_1.ensureError)(result.reason);
                if (abort.signal.aborted)
                    throw (0, ensure_error_1.ensureError)(abort.signal.reason);
                const nodeName = webhooks[index].node;
                if (this.shouldAbandonFailedTeardown(error)) {
                    this.logger.warn('Abandoned webhook whose deregistration can never succeed', {
                        workflowId: workflow.id,
                        nodeName,
                        error: error.message,
                    });
                }
                else {
                    this.logger.warn('Abandoned webhook whose external deregistration kept failing', {
                        workflowId: workflow.id,
                        nodeName,
                        error: error.message,
                    });
                    if (!failuresByNode.has(nodeName))
                        failuresByNode.set(nodeName, { nodeName, error });
                }
            }
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
        await this.workflowStaticDataService.saveStaticData(workflow);
        return [...failuresByNode.values()];
    }
    getNodeWebhooks(workflow, nodeIds, additionalData, failuresByNode) {
        const webhooks = [];
        for (const targetNode of Object.values(workflow.nodes)) {
            if (!nodeIds.has(targetNode.id))
                continue;
            try {
                webhooks.push(...this.webhookTriggerRegistrar.getNodeWebhookTriggers(workflow, targetNode, additionalData));
            }
            catch (discoveryError) {
                const error = (0, ensure_error_1.ensureError)(discoveryError);
                this.logger.warn('Abandoned external webhook cleanup after failed discovery', {
                    workflowId: workflow.id,
                    nodeName: targetNode.name,
                    error: error.message,
                });
                failuresByNode.set(targetNode.name, { nodeName: targetNode.name, error });
            }
        }
        return webhooks;
    }
    async deregisterExternalWebhookWithRetry(workflow, webhookData, abort) {
        for (let attempt = 0;; attempt++) {
            try {
                await raceAbort(this.webhookTriggerRegistrar.deregister({ workflow, webhookData }), abort);
                return;
            }
            catch (error) {
                const isLastAttempt = attempt >= constants_1.TRIGGER_TEARDOWN_MAX_ATTEMPTS - 1;
                if (this.shouldAbandonFailedTeardown(error) || isLastAttempt || abort.signal.aborted) {
                    throw error;
                }
                await (0, sleep_1.sleep)(constants_1.TRIGGER_TEARDOWN_RETRY_INITIAL_DELAY_MS * 2 ** attempt, abort.signal);
            }
        }
    }
    getWebhookTriggersForNodeIds(workflow, additionalData, nodeIds) {
        return this.webhookTriggerRegistrar
            .getWebhookTriggers(workflow, additionalData)
            .filter((webhookData) => nodeIds.has(workflow.getNode(webhookData.node)?.id ?? ''));
    }
    async registerNonWebhookTriggers(dbWorkflow, workflow, additionalData, resolveWorkflowData, nodeIds, outcome, activationMode, abort) {
        const triggerNodeIds = this.getNonWebhookTriggerNodeIdsForNodeIds(workflow, nodeIds);
        if (triggerNodeIds.length === 0)
            return;
        const registration = this.nonWebhookTriggerRegistrar.createRegistrationContext(dbWorkflow, {
            activationMode,
            executionMode: 'trigger',
            additionalData,
            resolveWorkflowData,
            onTriggerFailure: ({ error, node, workflowData, mode, activation }) => {
                void this.recoverFromRuntimeTriggerFailure({
                    error,
                    node,
                    workflow,
                    workflowData,
                    registration,
                    mode,
                    activation,
                });
            },
        });
        const results = await Promise.all(triggerNodeIds.map(async (nodeId) => {
            try {
                await raceAbort((0, trigger_activation_retry_1.retryTriggerActivation)(async () => await this.nonWebhookTriggerRegistrar.register(workflow, registration, nodeId), constants_1.TRIGGER_ACTIVATION_MAX_ATTEMPTS, abort.signal), abort);
                return (0, result_1.createResultOk)(nodeId);
            }
            catch (error) {
                return (0, result_1.createResultError)({
                    nodeId,
                    nodeName: this.resolveNodeName(workflow, nodeId),
                    error: (0, ensure_error_1.ensureError)(error),
                });
            }
        }));
        for (const result of results) {
            if (result.ok) {
                outcome.activated.push(result.result);
            }
            else {
                outcome.failures.push(result.error);
            }
        }
    }
    resolveNodeName(workflow, nodeId) {
        for (const node of Object.values(workflow.nodes)) {
            if (node.id === nodeId)
                return node.name;
        }
        return nodeId;
    }
    async deregisterNonWebhookTriggers(workflowId, workflow, nodeIds, abort) {
        const triggerNodeIds = this.getNonWebhookTriggerNodeIdsForNodeIds(workflow, nodeIds);
        await Promise.all(triggerNodeIds.map(async (nodeId) => {
            try {
                await raceAbort(this.nonWebhookTriggerRegistrar.deregister(workflowId, nodeId, abort.onDetached), abort);
            }
            catch (error) {
                if (!this.shouldAbandonFailedTeardown((0, ensure_error_1.ensureError)(error)))
                    throw error;
                this.logger.warn('Abandoned trigger whose deregistration can never succeed', {
                    workflowId,
                    nodeId,
                    error: (0, ensure_error_1.ensureError)(error).message,
                });
            }
        }));
    }
    shouldAbandonFailedTeardown(error) {
        if (error instanceof n8n_workflow_1.UserError)
            return true;
        return error instanceof Error && error.cause instanceof n8n_workflow_1.UserError;
    }
    getNonWebhookTriggerNodeIdsForNodeIds(workflow, nodeIds) {
        return this.nonWebhookTriggerRegistrar
            .getTriggerNodeIds(workflow)
            .filter((nodeId) => nodeIds.has(nodeId));
    }
    createWorkflowDataResolver(dbWorkflow) {
        return async () => await this.triggerExecutionContextFactory.loadPublishedWorkflowData(dbWorkflow.id);
    }
    throwRejectedPhaseError(results) {
        const rejected = results.find((result) => result.status === 'rejected');
        if (rejected)
            throw (0, ensure_error_1.ensureError)(rejected.reason);
    }
    async recoverFromRuntimeTriggerFailure({ error, node, workflow, workflowData, registration, mode, activation, }) {
        const workflowId = workflow.id;
        const activationError = new n8n_workflow_1.WorkflowActivationError(`The trigger node "${node.name}" failed at runtime and was deactivated`, { cause: error, node, level: 'warning' });
        this.errorReporter.warn(activationError, {
            extra: { workflowId, nodeId: node.id, nodeName: node.name, mode, activation },
            shouldBeLogged: true,
        });
        try {
            await this.nonWebhookTriggerRegistrar.deregister(workflowId, node.id);
            await this.activationErrorsService.register(workflowId, error.message);
            this.triggerExecutionContextFactory.executeErrorWorkflow(activationError, workflowData, mode);
            await (0, trigger_activation_retry_1.retryTriggerActivation)(async () => {
                await workflow.expression.acquireIsolate();
                try {
                    await this.nonWebhookTriggerRegistrar.register(workflow, registration, node.id);
                }
                finally {
                    await workflow.expression.releaseIsolate();
                }
            }, constants_1.TRIGGER_ACTIVATION_MAX_ATTEMPTS, new AbortController().signal);
            await this.workflowStaticDataService.saveStaticData(workflow);
            await this.activationErrorsService.deregister(workflowId);
        }
        catch (e) {
            const reactivationError = (0, ensure_error_1.ensureError)(e);
            this.logger.error(`Failed to reactivate trigger node "${node.name}" of workflow "${workflowData.name}" after a runtime failure`, { workflowId, nodeId: node.id, nodeName: node.name, error: reactivationError });
            this.errorReporter.error(reactivationError, {
                extra: { workflowId, nodeId: node.id, nodeName: node.name },
            });
        }
    }
};
exports.WorkflowTriggerActivator = WorkflowTriggerActivator;
exports.WorkflowTriggerActivator = WorkflowTriggerActivator = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, node_types_1.NodeTypes, db_1.WorkflowRepository, workflow_static_data_service_1.WorkflowStaticDataService, config_1.WorkflowsConfig, trigger_execution_context_factory_1.TriggerExecutionContextFactory, webhook_trigger_registrar_1.WebhookTriggerRegistrar, non_webhook_trigger_registrar_1.NonWebhookTriggerRegistrar, trigger_count_service_1.TriggerCountService, activation_errors_service_1.ActivationErrorsService, n8n_core_1.Tracing, backend_services_1.EventService])
], WorkflowTriggerActivator);
//# sourceMappingURL=workflow-trigger-activator.js.map