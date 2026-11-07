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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineV2Dispatcher = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = __importDefault(require("node:assert"));
const types_1 = require("../executions/execution-data/types");
const execution_id_1 = require("../executions/execution-id");
const pre_execution_checks_1 = require("../executions/pre-execution-checks");
const engine_data_plane_proxy_service_1 = require("../services/engine-data-plane-proxy.service");
const engine_v2_payload_files_service_1 = require("../services/engine-v2-payload-files.service");
const engine_v2_push_registry_service_1 = require("../services/engine-v2-push-registry.service");
const engine_v2_response_expectation_1 = require("../webhooks/engine-v2-response-expectation");
const ROUTED_MODES = new Set(['manual', 'webhook', 'trigger']);
const DEFAULT_MAIN_OUTPUT = [[{ json: {} }]];
const withoutNullSlots = (main) => main.map((slot) => slot ?? []);
let EngineV2Dispatcher = class EngineV2Dispatcher {
    constructor(proxy, credentialsPermissionChecker, pushRegistry, payloadFiles) {
        this.proxy = proxy;
        this.credentialsPermissionChecker = credentialsPermissionChecker;
        this.pushRegistry = pushRegistry;
        this.payloadFiles = payloadFiles;
    }
    routesToEngineV2(data, existingExecution) {
        return (this.handlesWorkflow(data.workflowData, data.executionMode) && existingExecution === undefined);
    }
    handlesWorkflow(workflowData, executionMode) {
        return workflowData.settings?.engineType === 'v2' && ROUTED_MODES.has(executionMode);
    }
    async start(data) {
        const trigger = this.resolveFiredTrigger(data);
        let prepared;
        try {
            prepared = await this.prepare(data, trigger);
        }
        catch (error) {
            await this.payloadFiles.discard(trigger.outputs);
            throw error;
        }
        const { executionId, request } = prepared;
        try {
            await this.proxy.startExecution(request);
        }
        catch (error) {
            this.pushRegistry.release(executionId);
            if ((0, engine_data_plane_proxy_service_1.isStartRefusedBeforeSave)(error))
                await this.payloadFiles.discard(trigger.outputs);
            throw error;
        }
        return executionId;
    }
    async prepare(data, trigger) {
        this.assertSupported(data, trigger);
        const { workflowData } = data;
        await this.credentialsPermissionChecker.check(workflowData.id, workflowData.nodes, data.userId);
        const { V1WorkflowConverter, toStepOutputs } = await import('@n8n/node-engine-compatibility');
        const graph = new V1WorkflowConverter().convert(workflowData, trigger.name);
        const executionId = data.engineV2ExecutionId ?? (0, execution_id_1.createExecutionIdV2)();
        (0, node_assert_1.default)((0, execution_id_1.isExecutionIdV2)(executionId), 'Engine v2 was given an id it cannot run');
        await this.payloadFiles.claimForExecution(trigger.outputs, executionId);
        this.registerPushSession(executionId, data, trigger);
        return {
            executionId,
            request: {
                executionId,
                workflowId: workflowData.id,
                graph,
                workflow: (0, types_1.toWorkflowDocument)(workflowData),
                triggerOutputs: this.toTriggerOutputs(trigger.outputs, toStepOutputs),
                mode: data.executionMode === 'manual' ? 'manual' : 'production',
                callerContext: {
                    hostMode: data.executionMode,
                    userId: data.userId,
                    projectId: data.projectId,
                },
                responseExpectation: (0, engine_v2_response_expectation_1.toResponseExpectation)(data.engineV2Response?.responseMode),
            },
        };
    }
    registerPushSession(executionId, data, trigger) {
        const { pushRef, workflowData } = data;
        if (!pushRef)
            return;
        this.pushRegistry.register(executionId, {
            pushRef,
            workflowId: workflowData.id,
            trigger: trigger.name === undefined
                ? undefined
                : { nodeName: trigger.name, outputs: trigger.outputs },
        });
    }
    assertSupported(data, trigger) {
        if (!this.proxy.isAvailable()) {
            throw new n8n_workflow_1.UserError('Engine v2 is not available. Enable the `engine-v2` module with N8N_ENABLED_MODULES.');
        }
        if (data.runData !== undefined) {
            throw new n8n_workflow_1.UserError('Engine v2 cannot run a workflow from existing data yet. Run the whole workflow instead.');
        }
        if (data.destinationNode !== undefined) {
            throw new n8n_workflow_1.UserError('Engine v2 cannot run a workflow up to a single node yet. Run the whole workflow instead.');
        }
        if (data.startNodes?.length) {
            throw new n8n_workflow_1.UserError('Engine v2 cannot start from selected nodes yet. Run the whole workflow instead.');
        }
        if (data.agentRequest !== undefined) {
            throw new n8n_workflow_1.UserError('Engine v2 cannot run a workflow as an AI tool yet.');
        }
        const firedNode = this.firedTriggerNode(data, trigger.name);
        if (firedNode !== undefined &&
            (0, n8n_workflow_1.classifyTriggerIdentity)(firedNode.type, firedNode.parameters).providesExternalIdentity) {
            throw new n8n_workflow_1.UserError(`Engine v2 cannot run the "${firedNode.name}" trigger yet, because it takes credentials from the request.`);
        }
        const pinnedNode = Object.keys(data.pinData ?? {}).find((name) => name !== trigger.name);
        if (pinnedNode !== undefined) {
            throw new n8n_workflow_1.UserError(`Engine v2 does not support pinned data on "${pinnedNode}" yet. Unpin it to run this workflow.`);
        }
    }
    firedTriggerNode(data, name) {
        const liveNodes = data.workflowData.nodes.filter((node) => node.disabled !== true);
        return name === undefined
            ? liveNodes.find((node) => (0, n8n_workflow_1.isTriggerNodeType)(node.type))
            : liveNodes.find((node) => node.name === name);
    }
    resolveFiredTrigger(data) {
        const seeded = data.triggerToStartFrom
            ? undefined
            : data.executionData?.executionData?.nodeExecutionStack[0];
        if (seeded !== undefined && (0, n8n_workflow_1.isTriggerNodeType)(seeded.node.type)) {
            return { name: seeded.node.name, outputs: withoutNullSlots(seeded.data.main) };
        }
        return { name: data.triggerToStartFrom?.name, outputs: this.triggerMainOutputs(data) };
    }
    triggerMainOutputs(data) {
        const triggerName = data.triggerToStartFrom?.name;
        const pinned = triggerName ? data.pinData?.[triggerName] : undefined;
        const main = data.triggerToStartFrom?.data?.data?.main ??
            (pinned ? [pinned] : undefined) ??
            DEFAULT_MAIN_OUTPUT;
        return withoutNullSlots(main);
    }
    toTriggerOutputs(main, toStepOutputs) {
        const slots = toStepOutputs(main);
        return slots.length === 0 ? null : slots;
    }
};
exports.EngineV2Dispatcher = EngineV2Dispatcher;
exports.EngineV2Dispatcher = EngineV2Dispatcher = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_data_plane_proxy_service_1.EngineDataPlaneProxyService, pre_execution_checks_1.CredentialsPermissionChecker, engine_v2_push_registry_service_1.EngineV2PushRegistry, engine_v2_payload_files_service_1.EngineV2PayloadFiles])
], EngineV2Dispatcher);
//# sourceMappingURL=engine-v2-dispatcher.service.js.map