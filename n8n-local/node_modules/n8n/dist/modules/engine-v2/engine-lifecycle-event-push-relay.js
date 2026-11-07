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
exports.EngineLifecycleEventPushRelay = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const node_engine_compatibility_1 = require("@n8n/node-engine-compatibility");
const n8n_workflow_1 = require("n8n-workflow");
const push_1 = require("../../push");
const engine_v2_push_registry_service_1 = require("../../services/engine-v2-push-registry.service");
const engine_v2_push_session_1 = require("../../services/engine-v2-push-session");
const get_item_count_by_connection_type_1 = require("../../utils/get-item-count-by-connection-type");
const STEP_FAILURE_DESCRIPTION = 'Engine v2 does not report error detail yet.';
let EngineLifecycleEventPushRelay = class EngineLifecycleEventPushRelay {
    constructor(registry, push, logger) {
        this.registry = registry;
        this.push = push;
        this.logger = logger;
        this.logger = this.logger.scoped('engine-v2');
    }
    relay(events) {
        for (const update of events) {
            const session = this.registry.get(update.executionId);
            if (!session)
                continue;
            try {
                this.relayOne(update, session);
            }
            catch (error) {
                this.logger.error('Failed to relay engine lifecycle event to the editor', {
                    executionId: update.executionId,
                    type: update.type,
                    error,
                });
            }
        }
    }
    relayOne(update, session) {
        switch (update.type) {
            case 'execution:started':
                return this.onExecutionStarted(update.executionId, update.at, session);
            case 'step:started':
                return this.onStepStarted(update, session);
            case 'step:completed':
                return this.onStepSettled(update, session, (0, node_engine_compatibility_1.fromStepInputs)(update.outputs));
            case 'step:failed':
                return this.onStepSettled(update, session, undefined);
            case 'execution:completed':
                return this.onExecutionFinished(update.executionId, update.workflowId, 'success', session);
            case 'execution:failed':
                return this.onExecutionFinished(update.executionId, update.workflowId, 'error', session);
            case 'execution:cancelled':
                return this.onExecutionFinished(update.executionId, update.workflowId, 'canceled', session);
        }
    }
    onExecutionStarted(executionId, at, session) {
        const { trigger } = session;
        session.trigger = undefined;
        if (!trigger)
            return;
        const run = new engine_v2_push_session_1.EngineV2StepRun(session.nextExecutionIndex++, Date.parse(at));
        this.sendNodeExecuteBefore(executionId, trigger.nodeName, run, session);
        this.sendNodeExecuteAfter(executionId, trigger.nodeName, run, session, {
            executionTime: 0,
            outputs: trigger.outputs,
        });
    }
    onStepStarted(update, session) {
        if (session.steps.has(update.stepId))
            return;
        const run = new engine_v2_push_session_1.EngineV2StepRun(session.nextExecutionIndex++, Date.parse(update.at));
        session.steps.set(update.stepId, run);
        this.sendNodeExecuteBefore(update.executionId, update.nodeName, run, session);
    }
    onStepSettled(update, session, outputs) {
        const started = session.steps.get(update.stepId);
        if (started?.settled)
            return;
        const run = started ?? new engine_v2_push_session_1.EngineV2StepRun(session.nextExecutionIndex++, Date.parse(update.at));
        session.steps.set(update.stepId, run);
        this.sendNodeExecuteAfter(update.executionId, update.nodeName, run, session, {
            executionTime: Math.max(0, Date.parse(update.at) - run.startTime),
            outputs,
        });
        run.settled = true;
    }
    onExecutionFinished(executionId, workflowId, status, session) {
        this.push.send({ type: 'executionFinished', data: { executionId, workflowId, status } }, session.pushRef);
        this.registry.release(executionId);
    }
    sendNodeExecuteBefore(executionId, nodeName, run, session) {
        this.push.send({
            type: 'nodeExecuteBefore',
            data: {
                executionId,
                nodeName,
                sequenceNumber: session.sequenceNumber++,
                data: { startTime: run.startTime, executionIndex: run.executionIndex, source: [] },
            },
        }, session.pushRef);
    }
    sendNodeExecuteAfter(executionId, nodeName, run, session, result) {
        const { executionTime, outputs } = result;
        const data = outputs ? { main: outputs } : undefined;
        const taskData = {
            startTime: run.startTime,
            executionIndex: run.executionIndex,
            source: [],
            executionTime,
            executionStatus: outputs ? 'success' : 'error',
            data,
            ...(outputs
                ? {}
                : {
                    error: new n8n_workflow_1.WorkflowOperationError('Node execution failed', undefined, STEP_FAILURE_DESCRIPTION),
                }),
        };
        const itemCountByConnectionType = (0, get_item_count_by_connection_type_1.getItemCountByConnectionType)(data);
        const { data: _withheld, ...trimmed } = taskData;
        this.push.send({
            type: 'nodeExecuteAfter',
            data: {
                executionId,
                nodeName,
                sequenceNumber: session.sequenceNumber++,
                data: trimmed,
                itemCountByConnectionType,
            },
        }, session.pushRef);
        if (!data)
            return;
        const asBinary = true;
        this.push.send({
            type: 'nodeExecuteAfterData',
            data: { executionId, nodeName, data: taskData, itemCountByConnectionType },
        }, session.pushRef, asBinary);
    }
};
exports.EngineLifecycleEventPushRelay = EngineLifecycleEventPushRelay;
exports.EngineLifecycleEventPushRelay = EngineLifecycleEventPushRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_v2_push_registry_service_1.EngineV2PushRegistry, push_1.Push, backend_common_1.Logger])
], EngineLifecycleEventPushRelay);
//# sourceMappingURL=engine-lifecycle-event-push-relay.js.map