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
exports.NonWebhookTriggerRegistrar = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const poll_trigger_job_registrar_1 = require("../../scheduling/poll-trigger-node/poll-trigger-job-registrar");
const schedule_trigger_job_registrar_1 = require("../../scheduling/schedule-trigger-node/schedule-trigger-job-registrar");
const trigger_execution_context_factory_1 = require("../../workflows/triggers/trigger-execution-context.factory");
let NonWebhookTriggerRegistrar = class NonWebhookTriggerRegistrar {
    constructor(logger, activeWorkflowTriggers, triggerExecutionContextFactory, scheduleTriggerJobRegistrar, pollTriggerJobRegistrar, tracing) {
        this.logger = logger;
        this.activeWorkflowTriggers = activeWorkflowTriggers;
        this.triggerExecutionContextFactory = triggerExecutionContextFactory;
        this.scheduleTriggerJobRegistrar = scheduleTriggerJobRegistrar;
        this.pollTriggerJobRegistrar = pollTriggerJobRegistrar;
        this.tracing = tracing;
        this.logger = this.logger.scoped('workflow-publication');
    }
    getTriggerNodeIds(workflow) {
        return [...workflow.getTriggerNodes(), ...workflow.getPollNodes()].map((node) => node.id);
    }
    getRegisteredTriggerNodeIds(workflowId) {
        return this.activeWorkflowTriggers.getRegisteredTriggerNodeIds(workflowId);
    }
    createRegistrationContext(dbWorkflow, { activationMode, executionMode, additionalData, resolveWorkflowData, onTriggerFailure, }) {
        const scheduleCollectionSession = this.scheduleTriggerJobRegistrar.createSession();
        const getTriggerFunctions = this.triggerExecutionContextFactory.getExecuteTriggerFunctions(dbWorkflow, additionalData, executionMode, activationMode, resolveWorkflowData, onTriggerFailure, scheduleCollectionSession);
        const getPollFunctions = this.triggerExecutionContextFactory.getExecutePollFunctions(dbWorkflow, additionalData, executionMode, activationMode, resolveWorkflowData);
        return {
            activationMode,
            executionMode,
            additionalData,
            getTriggerFunctions,
            getPollFunctions,
            scheduleCollectionSession,
        };
    }
    async register(workflow, { activationMode, executionMode, additionalData, getTriggerFunctions, getPollFunctions, scheduleCollectionSession, }, nodeId) {
        await this.tracing.startSpan({
            name: 'Non-webhook trigger register',
            op: 'publication.non_webhook.register',
            attributes: {
                ...this.tracing.pickWorkflowAttributes({ id: workflow.id, name: workflow.name }),
                ...this.tracing.pickNodeAttributes({ id: nodeId }),
                'n8n.publication.activation_mode': activationMode,
                'n8n.publication.execution_mode': executionMode,
            },
        }, async (span) => {
            try {
                await this.activeWorkflowTriggers.addTriggers(workflow.id, workflow, [nodeId], additionalData, executionMode, activationMode, getTriggerFunctions, getPollFunctions);
                await scheduleCollectionSession.commit(workflow.id, nodeId);
            }
            finally {
                scheduleCollectionSession.discard(workflow.id, nodeId);
            }
            span.setStatus({ code: 1 });
        });
    }
    async deregister(workflowId, nodeId, onDetached) {
        await this.tracing.startSpan({
            name: 'Non-webhook trigger deregister',
            op: 'publication.non_webhook.deregister',
            attributes: {
                ...this.tracing.pickWorkflowAttributes({ id: workflowId }),
                ...this.tracing.pickNodeAttributes({ id: nodeId }),
            },
        }, async (span) => {
            const inMemory = this.activeWorkflowTriggers.removeTriggers(workflowId, new Set([nodeId]));
            void inMemory.catch((error) => {
                this.logger.error('Failed to deregister a trigger node from memory', {
                    workflowId,
                    nodeId,
                    error: (0, ensure_error_1.ensureError)(error),
                });
            });
            try {
                await this.removeDurableJobs(workflowId, nodeId);
            }
            catch (error) {
                onDetached?.(inMemory);
                throw (0, ensure_error_1.ensureError)(error);
            }
            try {
                await inMemory;
            }
            catch (error) {
                throw (0, ensure_error_1.ensureError)(error);
            }
            span.setStatus({ code: 1 });
        });
    }
    async removeDurableJobs(workflowId, nodeId) {
        const results = await Promise.allSettled([
            this.scheduleTriggerJobRegistrar.remove(workflowId, nodeId),
            this.pollTriggerJobRegistrar.remove(workflowId, nodeId),
        ]);
        const failure = results.find((result) => result.status === 'rejected');
        if (failure) {
            throw (0, ensure_error_1.ensureError)(failure.reason);
        }
    }
};
exports.NonWebhookTriggerRegistrar = NonWebhookTriggerRegistrar;
exports.NonWebhookTriggerRegistrar = NonWebhookTriggerRegistrar = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ActiveWorkflowTriggers, trigger_execution_context_factory_1.TriggerExecutionContextFactory, schedule_trigger_job_registrar_1.ScheduleTriggerJobRegistrar, poll_trigger_job_registrar_1.PollTriggerJobRegistrar, n8n_core_1.Tracing])
], NonWebhookTriggerRegistrar);
//# sourceMappingURL=non-webhook-trigger-registrar.js.map