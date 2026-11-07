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
exports.ActiveWorkflowManager = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const chunk_1 = __importDefault(require("lodash/chunk"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = require("node:assert");
const activation_errors_service_1 = require("./activation-errors.service");
const constants_1 = require("./constants");
const message_event_bus_1 = require("./eventbus/message-event-bus/message-event-bus");
const external_hooks_1 = require("./external-hooks");
const node_types_1 = require("./node-types");
const enforce_workflow_publish_1 = require("./policy/enforce-workflow-publish");
const policy_enforcement_service_1 = require("./policy/policy-enforcement.service");
const policy_violation_error_1 = require("./policy/policy-violation.error");
const publisher_service_1 = require("./scaling/pubsub/publisher.service");
const poll_trigger_job_registrar_1 = require("./scheduling/poll-trigger-node/poll-trigger-job-registrar");
const schedule_trigger_job_registrar_1 = require("./scheduling/schedule-trigger-node/schedule-trigger-job-registrar");
const active_workflows_service_1 = require("./services/active-workflows.service");
const ownership_service_1 = require("./services/ownership.service");
const WebhookHelpers = __importStar(require("./webhooks/webhook-helpers"));
const webhook_service_1 = require("./webhooks/webhook.service");
const WorkflowExecuteAdditionalData = __importStar(require("./workflow-execute-additional-data"));
const trigger_execution_context_factory_1 = require("./workflows/triggers/trigger-execution-context.factory");
const utils_1 = require("./workflows/utils");
const workflow_push_notifier_service_1 = require("./workflows/workflow-push-notifier.service");
const workflow_static_data_service_1 = require("./workflows/workflow-static-data.service");
const workflow_formatter_1 = require("./workflows/workflow.formatter");
let ActiveWorkflowManager = class ActiveWorkflowManager {
    constructor(logger, errorReporter, activeWorkflowTriggers, externalHooks, nodeTypes, webhookService, workflowRepository, activationErrorsService, workflowStaticDataService, activeWorkflowsService, instanceSettings, publisher, workflowsConfig, triggerExecutionContextFactory, eventBus, scheduleTriggerJobRegistrar, pollTriggerJobRegistrar, workflowPushNotifier, policyEnforcementService, ownershipService) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.activeWorkflowTriggers = activeWorkflowTriggers;
        this.externalHooks = externalHooks;
        this.nodeTypes = nodeTypes;
        this.webhookService = webhookService;
        this.workflowRepository = workflowRepository;
        this.activationErrorsService = activationErrorsService;
        this.workflowStaticDataService = workflowStaticDataService;
        this.activeWorkflowsService = activeWorkflowsService;
        this.instanceSettings = instanceSettings;
        this.publisher = publisher;
        this.workflowsConfig = workflowsConfig;
        this.triggerExecutionContextFactory = triggerExecutionContextFactory;
        this.eventBus = eventBus;
        this.scheduleTriggerJobRegistrar = scheduleTriggerJobRegistrar;
        this.pollTriggerJobRegistrar = pollTriggerJobRegistrar;
        this.workflowPushNotifier = workflowPushNotifier;
        this.policyEnforcementService = policyEnforcementService;
        this.ownershipService = ownershipService;
        this.queuedActivations = {};
        this.isActivationInProgress = false;
        this.logger = this.logger.scoped(['workflow-activation']);
    }
    async init() {
        (0, node_assert_1.strict)(this.instanceSettings.instanceRole !== 'unset', 'Active workflow manager expects instance role to be set');
        await this.addActiveWorkflows('init');
        await this.externalHooks.run('activeWorkflows.initialized');
    }
    async getAllWorkflowActivationErrors() {
        return await this.activationErrorsService.getAll();
    }
    async removeAll() {
        let activeWorkflowIds = [];
        this.logger.debug('Call to remove all active workflows received (removeAll)');
        activeWorkflowIds.push(...this.activeWorkflowTriggers.allActiveWorkflows());
        const activeWorkflows = await this.activeWorkflowsService.getAllActiveIdsInStorage();
        activeWorkflowIds = [...activeWorkflowIds, ...activeWorkflows];
        activeWorkflowIds = Array.from(new Set(activeWorkflowIds));
        const removePromises = [];
        for (const workflowId of activeWorkflowIds) {
            removePromises.push(this.remove(workflowId));
        }
        await Promise.all(removePromises);
    }
    allActiveInMemory() {
        return this.activeWorkflowTriggers.allActiveWorkflows();
    }
    async addWebhooks(workflow, additionalData, mode, activation, nodeIds) {
        let webhooks = WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, undefined, true);
        if (nodeIds) {
            webhooks = webhooks.filter((webhookData) => nodeIds.has(workflow.getNode(webhookData.node)?.id ?? ''));
        }
        if (webhooks.length === 0)
            return false;
        for (const webhookData of webhooks) {
            const node = workflow.getNode(webhookData.node);
            node.name = webhookData.node;
            const webhook = this.webhookService.createWebhook({
                workflowId: webhookData.workflowId,
                webhookPath: webhookData.path,
                node: node.name,
                method: webhookData.httpMethod,
            }, node.webhookId);
            try {
                await this.webhookService.storeWebhook(webhook);
                await this.webhookService.createWebhookIfNotExists(workflow, webhookData, mode, activation);
            }
            catch (error) {
                if (['init', 'leadershipChange'].includes(activation) &&
                    error.name === 'QueryFailedError') {
                    continue;
                }
                try {
                    await this.clearWebhooks(workflow.id);
                }
                catch (error1) {
                    this.errorReporter.error(error1);
                    this.logger.error(`Could not remove webhooks of workflow "${workflow.id}" because of error: "${error1.message}"`);
                }
                if (error instanceof Error && error.name === 'QueryFailedError') {
                    error = new n8n_workflow_1.WebhookPathTakenError(webhook.node, error);
                }
                else if (error.detail) {
                    error.message = error.detail;
                }
                throw error;
            }
        }
        await this.workflowStaticDataService.saveStaticData(workflow);
        this.logger.debug(`Added webhooks for workflow "${workflow.name}" (ID ${workflow.id})`, {
            workflowId: workflow.id,
        });
        return true;
    }
    async clearWebhooks(workflowId) {
        const workflowData = await this.workflowRepository.findOne({
            where: { id: workflowId },
            relations: { activeVersion: true },
        });
        if (workflowData === null) {
            throw new n8n_workflow_1.UnexpectedError('Could not find workflow', { extra: { workflowId } });
        }
        if (!workflowData.activeVersion) {
            throw new n8n_workflow_1.UnexpectedError('Active version not found for workflow', {
                extra: { workflowId },
            });
        }
        const { nodes, connections } = workflowData.activeVersion;
        const workflow = new n8n_workflow_1.Workflow({
            id: workflowId,
            name: workflowData.name,
            nodes,
            connections,
            active: true,
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings,
        });
        const additionalData = await WorkflowExecuteAdditionalData.getBase({
            workflowId: workflow.id,
            workflowSettings: workflowData.settings,
        });
        await this.deregisterWebhooks(workflow, additionalData);
        await this.webhookService.deleteWorkflowWebhooks(workflowId);
    }
    async deregisterWebhooks(workflow, additionalData, nodeIds) {
        const removedNodeNames = [];
        await workflow.expression.acquireIsolate();
        try {
            const webhooks = WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, undefined, true);
            for (const webhookData of webhooks) {
                if (nodeIds && !nodeIds.has(workflow.getNode(webhookData.node)?.id ?? '')) {
                    continue;
                }
                await this.webhookService.deleteWebhook(workflow, webhookData, 'internal', 'update');
                removedNodeNames.push(webhookData.node);
            }
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
        await this.workflowStaticDataService.saveStaticData(workflow);
        return removedNodeNames;
    }
    getExecutePollFunctions(workflowData, additionalData, mode, activation, resolveWorkflowData) {
        return this.triggerExecutionContextFactory.getExecutePollFunctions(workflowData, additionalData, mode, activation, resolveWorkflowData);
    }
    getExecuteTriggerFunctions(workflowData, additionalData, mode, activation, resolveWorkflowData, scheduleCollectionSession) {
        return this.triggerExecutionContextFactory.getExecuteTriggerFunctions(workflowData, additionalData, mode, activation, resolveWorkflowData, ({ error, node, workflowData: failedWorkflowData, mode: failureMode, activation: failureActivation, }) => {
            this.logger.info(`The trigger node "${node.name}" of workflow "${failedWorkflowData.name}" failed with the error: "${error.message}". Will try to reactivate.`, {
                nodeName: node.name,
                workflowId: failedWorkflowData.id,
                workflowName: failedWorkflowData.name,
            });
            void this.activeWorkflowTriggers.remove(failedWorkflowData.id);
            void this.activationErrorsService.register(failedWorkflowData.id, error.message);
            const activationError = new n8n_workflow_1.WorkflowActivationError(`The workflow was deactivated because its trigger node "${node.name}" failed`, { cause: error, node });
            this.executeErrorWorkflow(activationError, failedWorkflowData, failureMode);
            this.addQueuedWorkflowActivation(failureActivation, failedWorkflowData);
        }, scheduleCollectionSession);
    }
    executeErrorWorkflow(error, workflowData, mode) {
        this.triggerExecutionContextFactory.executeErrorWorkflow(error, workflowData, mode);
    }
    async addActiveWorkflows(activationMode) {
        if (this.isActivationInProgress) {
            this.logger.debug(`Skipping activation - already in progress for mode: ${activationMode}`);
            return;
        }
        this.isActivationInProgress = true;
        try {
            const dbWorkflowIds = await this.workflowRepository.getAllActiveIds();
            if (dbWorkflowIds.length === 0)
                return;
            if (this.instanceSettings.isLeader) {
                this.logger.info('Start Active Workflows:');
            }
            const batches = (0, chunk_1.default)(dbWorkflowIds, this.workflowsConfig.activationBatchSize);
            for (const batch of batches) {
                const activationPromises = batch.map(async (dbWorkflowId) => {
                    await this.activateWorkflow(dbWorkflowId, activationMode);
                });
                await Promise.all(activationPromises);
            }
            this.logger.debug('Finished activating all workflows');
        }
        finally {
            this.isActivationInProgress = false;
        }
    }
    async activateWorkflow(workflowId, activationMode) {
        const dbWorkflow = await this.workflowRepository.findById(workflowId);
        if (!dbWorkflow)
            return;
        try {
            const added = await this.add(dbWorkflow.id, activationMode, dbWorkflow, {
                shouldPublish: false,
            });
            if (added.webhooks || added.triggersAndPollers) {
                this.logger.info(`Activated workflow ${(0, workflow_formatter_1.formatWorkflow)(dbWorkflow)}`, {
                    workflowName: dbWorkflow.name,
                    workflowId: dbWorkflow.id,
                });
                void this.eventBus.sendAuditEvent({
                    eventName: 'n8n.audit.workflow.activated',
                    payload: {
                        workflowId: dbWorkflow.id,
                        workflowName: dbWorkflow.name,
                        activeVersionId: dbWorkflow.activeVersionId,
                        activationMode,
                    },
                });
            }
        }
        catch (error) {
            if ((0, policy_violation_error_1.isPolicyRefusal)(error)) {
                this.logger.warn(`Publication of ${(0, workflow_formatter_1.formatWorkflow)(dbWorkflow)} blocked by policy`, {
                    workflowId: dbWorkflow.id,
                });
                return;
            }
            this.errorReporter.error(error);
            this.logger.error(`Issue on initial workflow activation try of ${(0, workflow_formatter_1.formatWorkflow)(dbWorkflow)} (startup)`, {
                error,
                workflowName: dbWorkflow.name,
                workflowId: dbWorkflow.id,
            });
            if (!dbWorkflow.activeVersion) {
                throw new n8n_workflow_1.UnexpectedError('Active version not found for workflow', {
                    extra: { workflowId: dbWorkflow.id },
                });
            }
            const { nodes, connections } = dbWorkflow.activeVersion;
            const workflowForError = { ...dbWorkflow, nodes, connections };
            this.executeErrorWorkflow(error, workflowForError, 'internal');
            if (error.message.includes('Authorization'))
                return;
            this.addQueuedWorkflowActivation('init', dbWorkflow);
        }
    }
    async clearAllActivationErrors() {
        this.logger.debug('Clearing all activation errors');
        await this.activationErrorsService.clearAll();
    }
    async addAllNonWebhookTriggerWorkflows() {
        if (this.workflowsConfig.useWorkflowPublicationService)
            return;
        await this.addActiveWorkflows('leadershipChange');
    }
    async removeAllNonWebhookTriggerWorkflows() {
        if (this.workflowsConfig.useWorkflowPublicationService)
            return;
        this.removeAllQueuedWorkflowActivations();
        await this.activeWorkflowTriggers.removeAllNonWebhookTriggerWorkflows();
    }
    async add(workflowId, activationMode, existingWorkflow, { shouldPublish = true, actor = { kind: 'system', reason: 'activation' }, } = {}) {
        const added = { webhooks: false, triggersAndPollers: false };
        const dbWorkflow = existingWorkflow ?? (await this.workflowRepository.findById(workflowId));
        if (!dbWorkflow) {
            throw new n8n_workflow_1.WorkflowActivationError(`Failed to find workflow with ID "${workflowId}"`, {
                level: 'warning',
            });
        }
        if (dbWorkflow.isArchived) {
            this.logger.debug('Cannot publish archived Workflow', { workflowId: dbWorkflow.id });
            return added;
        }
        if (this.instanceSettings.isMultiMain && shouldPublish) {
            if (!dbWorkflow?.activeVersionId) {
                throw new n8n_workflow_1.UnexpectedError('Active version ID not found for workflow', {
                    extra: { workflowId },
                });
            }
            void this.publisher.publishCommand({
                command: 'add-webhooks-triggers-and-pollers',
                payload: { workflowId, activeVersionId: dbWorkflow.activeVersionId, activationMode },
            });
            return added;
        }
        let workflow;
        const shouldAddWebhooks = this.shouldAddWebhooks(activationMode);
        const shouldAddNonWebhookTriggers = this.shouldAddNonWebhookTriggers();
        try {
            if (['init', 'leadershipChange'].includes(activationMode) && !dbWorkflow.activeVersion) {
                this.logger.debug(`Skipping workflow ${(0, workflow_formatter_1.formatWorkflow)(dbWorkflow)} as it is no longer active`, { workflowId: dbWorkflow.id });
                return added;
            }
            if (!dbWorkflow.activeVersion) {
                throw new n8n_workflow_1.UnexpectedError('Active version not found for workflow', {
                    extra: { workflowId: dbWorkflow.id },
                });
            }
            const { nodes, connections } = dbWorkflow.activeVersion;
            dbWorkflow.nodes = nodes;
            dbWorkflow.connections = connections;
            await (0, enforce_workflow_publish_1.enforceWorkflowPublishPolicy)(this.policyEnforcementService, this.ownershipService, { id: dbWorkflow.id, name: dbWorkflow.name, nodes }, actor);
            workflow = new n8n_workflow_1.Workflow({
                id: dbWorkflow.id,
                name: dbWorkflow.name,
                nodes,
                connections,
                active: true,
                nodeTypes: this.nodeTypes,
                staticData: dbWorkflow.staticData,
                settings: dbWorkflow.settings,
            });
            const validation = (0, n8n_workflow_1.validateWorkflowHasTriggerLikeNode)(workflow.nodes, this.nodeTypes, constants_1.STARTING_NODES);
            if (!validation.isValid) {
                throw new n8n_workflow_1.WorkflowActivationError(`Workflow ${(0, workflow_formatter_1.formatWorkflow)(dbWorkflow)} has no node to start the workflow - at least one active trigger, poll trigger, webhook trigger, or schedule trigger node is required`, { level: 'warning' });
            }
            const additionalData = await WorkflowExecuteAdditionalData.getBase({
                workflowId: workflow.id,
                workflowSettings: dbWorkflow.settings,
            });
            let triggerCount = 0;
            await workflow.expression.acquireIsolate();
            try {
                if (shouldAddWebhooks) {
                    added.webhooks = await this.addWebhooks(workflow, additionalData, 'trigger', activationMode);
                }
                const resolveWorkflowData = this.workflowsConfig.useWorkflowPublicationService
                    ? async () => await this.triggerExecutionContextFactory.loadPublishedWorkflowData(dbWorkflow.id)
                    : async () => dbWorkflow;
                if (shouldAddNonWebhookTriggers) {
                    added.triggersAndPollers = await this.addNonWebhookTriggers(dbWorkflow, workflow, {
                        activationMode,
                        executionMode: 'trigger',
                        additionalData,
                        resolveWorkflowData,
                    });
                }
                triggerCount = this.countTriggers(workflow, additionalData);
            }
            finally {
                await workflow.expression.releaseIsolate();
            }
            this.removeQueuedWorkflowActivation(workflowId);
            await this.activationErrorsService.deregister(workflowId);
            await this.workflowRepository.updateWorkflowTriggerCount(workflow.id, triggerCount);
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            await this.activationErrorsService.register(workflowId, error.message);
            throw e;
        }
        await this.workflowStaticDataService.saveStaticData(workflow);
        return added;
    }
    async handleDisplayWorkflowActivation({ workflowId, activeVersionId, }) {
        await this.workflowPushNotifier.notify(workflowId, {
            type: 'workflowActivated',
            data: { workflowId, activeVersionId },
        });
    }
    async handleDisplayWorkflowDeactivation({ workflowId }) {
        await this.workflowPushNotifier.notify(workflowId, {
            type: 'workflowDeactivated',
            data: { workflowId },
        });
    }
    async handleDisplayWorkflowActivationError({ workflowId, errorMessage, errorDescription, nodeId, }) {
        await this.workflowPushNotifier.notify(workflowId, {
            type: 'workflowFailedToActivate',
            data: { workflowId, errorMessage, errorDescription, nodeId },
        });
    }
    async handleAddWebhooksAndNonWebhookTriggers({ workflowId, activeVersionId, activationMode, }) {
        try {
            await this.add(workflowId, activationMode, undefined, {
                shouldPublish: false,
            });
        }
        catch (e) {
            const error = (0, ensure_error_1.ensureError)(e);
            const { message } = error;
            const nodeId = (0, utils_1.getErrorNodeId)(e);
            const errorDescription = (0, utils_1.getErrorDescription)(e);
            if (error instanceof n8n_workflow_1.IsolateError) {
                this.logger.warn(`Isolate error activating workflow "${workflowId}", queuing for retry: "${message}"`, { workflowId });
                const dbWorkflow = await this.workflowRepository.findById(workflowId);
                if (dbWorkflow)
                    this.addQueuedWorkflowActivation(activationMode, dbWorkflow);
                return;
            }
            if (!(0, policy_violation_error_1.isPolicyRefusal)(error)) {
                const dbWorkflow = await this.workflowRepository.findById(workflowId);
                try {
                    await this.clearWebhooks(workflowId);
                }
                catch (cleanupError) {
                    this.logger.error(`Failed to remove webhooks of workflow "${workflowId}"`, {
                        workflowId,
                        error: (0, ensure_error_1.ensureError)(cleanupError),
                    });
                }
                try {
                    await this.removeNonWebhookTriggers(workflowId);
                }
                catch (cleanupError) {
                    this.logger.error(`Failed to remove triggers of workflow "${workflowId}"`, {
                        workflowId,
                        error: (0, ensure_error_1.ensureError)(cleanupError),
                    });
                }
                await this.workflowRepository.update(workflowId, { active: false, activeVersionId: null });
                if (dbWorkflow && (activationMode === 'init' || activationMode === 'leadershipChange')) {
                    void this.eventBus.sendAuditEvent({
                        eventName: 'n8n.audit.workflow.deactivated',
                        payload: {
                            workflowId,
                            workflowName: dbWorkflow.name,
                            deactivatedVersionId: dbWorkflow.activeVersionId ?? null,
                            activationMode,
                            reason: error.name,
                        },
                    });
                }
            }
            await this.workflowPushNotifier.notify(workflowId, {
                type: 'workflowFailedToActivate',
                data: { workflowId, errorMessage: message, nodeId, errorDescription },
            });
            await this.publisher.publishCommand({
                command: 'display-workflow-activation-error',
                payload: { workflowId, errorMessage: message, nodeId, errorDescription },
            });
            return;
        }
        await this.workflowPushNotifier.notify(workflowId, {
            type: 'workflowActivated',
            data: { workflowId, activeVersionId },
        });
        void this.publisher
            .publishCommand({
            command: 'display-workflow-activation',
            payload: { workflowId, activeVersionId },
        })
            .catch((error) => this.errorReporter.error((0, ensure_error_1.ensureError)(error), { shouldBeLogged: true }));
    }
    countTriggers(workflow, additionalData) {
        const triggerFilter = (nodeType) => !!nodeType.trigger &&
            !nodeType.description.name.includes('manualTrigger') &&
            !constants_1.TRIGGER_COUNT_EXCLUDED_NODES.some((x) => x.endsWith(nodeType.description.name));
        const workflowWebhooks = WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, undefined, true);
        const uniqueWebhooks = workflowWebhooks.reduce((acc, webhook) => {
            acc.add(webhook.node);
            return acc;
        }, new Set());
        return (workflow.queryNodes(triggerFilter).length +
            workflow.getPollNodes().length +
            uniqueWebhooks.size);
    }
    addQueuedWorkflowActivation(activationMode, workflowData) {
        const workflowId = workflowData.id;
        const workflowName = workflowData.name;
        const own = {};
        const retryFunction = async () => {
            this.logger.info(`Try to activate workflow "${workflowName}" (${workflowId})`, {
                workflowId,
                workflowName,
            });
            try {
                await this.add(workflowId, activationMode, workflowData, { shouldPublish: false });
            }
            catch (error) {
                if ((0, policy_violation_error_1.isPolicyRefusal)(error)) {
                    this.logger.warn(`Publication of workflow "${workflowId}" blocked by policy`, {
                        workflowId,
                    });
                    if (this.queuedActivations[workflowId] === own.activation) {
                        this.removeQueuedWorkflowActivation(workflowId);
                    }
                    return;
                }
                this.errorReporter.error(error);
                const queuedActivation = this.queuedActivations[workflowId];
                if (!queuedActivation) {
                    return;
                }
                let lastTimeout = queuedActivation.lastTimeout;
                if (!(error instanceof n8n_workflow_1.IsolateError) && lastTimeout < constants_1.WORKFLOW_REACTIVATE_MAX_TIMEOUT) {
                    lastTimeout = Math.min(lastTimeout * 2, constants_1.WORKFLOW_REACTIVATE_MAX_TIMEOUT);
                }
                this.logger.info(`Activation of workflow "${workflowName}" (${workflowId}) did fail with error: "${error.message}" | retry in ${Math.floor(lastTimeout / 1000)} seconds`, {
                    error,
                    workflowId,
                    workflowName,
                });
                queuedActivation.lastTimeout = lastTimeout;
                queuedActivation.timeout = setTimeout(retryFunction, lastTimeout);
                return;
            }
            this.logger.info(`Activation of workflow "${workflowName}" (${workflowId}) was successful!`, {
                workflowId,
                workflowName,
            });
        };
        this.removeQueuedWorkflowActivation(workflowId);
        own.activation = {
            activationMode,
            lastTimeout: constants_1.WORKFLOW_REACTIVATE_INITIAL_TIMEOUT,
            timeout: setTimeout(retryFunction, constants_1.WORKFLOW_REACTIVATE_INITIAL_TIMEOUT),
            workflowData,
        };
        this.queuedActivations[workflowId] = own.activation;
    }
    removeQueuedWorkflowActivation(workflowId) {
        if (this.queuedActivations[workflowId]) {
            clearTimeout(this.queuedActivations[workflowId].timeout);
            delete this.queuedActivations[workflowId];
        }
    }
    removeAllQueuedWorkflowActivations() {
        for (const workflowId in this.queuedActivations) {
            this.removeQueuedWorkflowActivation(workflowId);
        }
    }
    async remove(workflowId) {
        if (this.instanceSettings.isMultiMain) {
            try {
                await this.clearWebhooks(workflowId);
            }
            catch (error) {
                this.errorReporter.error(error);
                this.logger.error(`Could not remove webhooks of workflow "${workflowId}" because of error: "${error.message}"`);
            }
            await this.removeDurableJobs(workflowId);
            void this.publisher.publishCommand({
                command: 'remove-triggers-and-pollers',
                payload: { workflowId },
            });
            return;
        }
        try {
            await this.clearWebhooks(workflowId);
        }
        catch (error) {
            this.errorReporter.error(error);
            this.logger.error(`Could not remove webhooks of workflow "${workflowId}" because of error: "${error.message}"`);
        }
        await this.activationErrorsService.deregister(workflowId);
        if (this.queuedActivations[workflowId] !== undefined) {
            this.removeQueuedWorkflowActivation(workflowId);
        }
        await this.removeNonWebhookTriggers(workflowId);
    }
    async handleRemoveNonWebhookTriggers({ workflowId, }) {
        await this.removeActivationError(workflowId);
        await this.removeNonWebhookTriggers(workflowId);
        await this.workflowPushNotifier.notify(workflowId, {
            type: 'workflowDeactivated',
            data: { workflowId },
        });
        await this.publisher.publishCommand({
            command: 'display-workflow-deactivation',
            payload: { workflowId },
        });
    }
    async removeDurableJobs(workflowId) {
        const results = await Promise.allSettled([
            this.scheduleTriggerJobRegistrar.removeWorkflow(workflowId),
            this.pollTriggerJobRegistrar.removeWorkflow(workflowId),
        ]);
        for (const result of results) {
            if (result.status === 'rejected') {
                this.errorReporter.error(result.reason);
                this.logger.error(`Could not remove durable jobs of workflow "${workflowId}" because of error: "${(0, ensure_error_1.ensureError)(result.reason).message}"`);
            }
        }
    }
    async removeNonWebhookTriggers(workflowId) {
        const wasRemoved = await this.activeWorkflowTriggers.remove(workflowId);
        await this.removeDurableJobs(workflowId);
        if (wasRemoved) {
            this.logger.debug(`Removed non-webhook triggers for workflow "${workflowId}"`, {
                workflowId,
            });
        }
    }
    async addNonWebhookTriggers(dbWorkflow, workflow, { activationMode, executionMode, additionalData, resolveWorkflowData, nodeIds, }) {
        const scheduleCollectionSession = this.scheduleTriggerJobRegistrar.createSession();
        const getTriggerFunctions = this.getExecuteTriggerFunctions(dbWorkflow, additionalData, executionMode, activationMode, resolveWorkflowData, scheduleCollectionSession);
        const getPollFunctions = this.getExecutePollFunctions(dbWorkflow, additionalData, executionMode, activationMode, resolveWorkflowData);
        const triggerAndPollNodeIds = [...workflow.getTriggerNodes(), ...workflow.getPollNodes()].map((node) => node.id);
        const nodeIdsToAdd = nodeIds
            ? triggerAndPollNodeIds.filter((id) => nodeIds.has(id))
            : triggerAndPollNodeIds;
        if (nodeIdsToAdd.length === 0) {
            return false;
        }
        try {
            await this.activeWorkflowTriggers.addTriggers(workflow.id, workflow, nodeIdsToAdd, additionalData, executionMode, activationMode, getTriggerFunctions, getPollFunctions);
            for (const nodeId of nodeIdsToAdd) {
                await scheduleCollectionSession.commit(workflow.id, nodeId);
            }
        }
        finally {
            for (const nodeId of nodeIdsToAdd) {
                scheduleCollectionSession.discard(workflow.id, nodeId);
            }
        }
        return true;
    }
    async removeActivationError(workflowId) {
        await this.activationErrorsService.deregister(workflowId);
    }
    shouldAddWebhooks(activationMode) {
        if (['init', 'leadershipChange'].includes(activationMode))
            return true;
        return this.instanceSettings.isLeader;
    }
    shouldAddNonWebhookTriggers() {
        return this.instanceSettings.isLeader;
    }
};
exports.ActiveWorkflowManager = ActiveWorkflowManager;
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "addAllNonWebhookTriggerWorkflows", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "removeAllNonWebhookTriggerWorkflows", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('display-workflow-activation', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "handleDisplayWorkflowActivation", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('display-workflow-deactivation', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "handleDisplayWorkflowDeactivation", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('display-workflow-activation-error', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "handleDisplayWorkflowActivationError", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('add-webhooks-triggers-and-pollers', {
        instanceType: 'main',
        instanceRole: 'leader',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "handleAddWebhooksAndNonWebhookTriggers", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('remove-triggers-and-pollers', { instanceType: 'main', instanceRole: 'leader' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "handleRemoveNonWebhookTriggers", null);
exports.ActiveWorkflowManager = ActiveWorkflowManager = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, n8n_core_1.ActiveWorkflowTriggers, external_hooks_1.ExternalHooks, node_types_1.NodeTypes, webhook_service_1.WebhookService, db_1.WorkflowRepository, activation_errors_service_1.ActivationErrorsService, workflow_static_data_service_1.WorkflowStaticDataService, active_workflows_service_1.ActiveWorkflowsService, n8n_core_1.InstanceSettings, publisher_service_1.Publisher, config_1.WorkflowsConfig, trigger_execution_context_factory_1.TriggerExecutionContextFactory, message_event_bus_1.MessageEventBus, schedule_trigger_job_registrar_1.ScheduleTriggerJobRegistrar, poll_trigger_job_registrar_1.PollTriggerJobRegistrar, workflow_push_notifier_service_1.WorkflowPushNotifier, policy_enforcement_service_1.PolicyEnforcementService, ownership_service_1.OwnershipService])
], ActiveWorkflowManager);
//# sourceMappingURL=active-workflow-manager.js.map