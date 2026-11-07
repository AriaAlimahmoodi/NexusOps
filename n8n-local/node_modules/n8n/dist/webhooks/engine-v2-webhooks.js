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
exports.EngineV2Webhooks = void 0;
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const engine_data_plane_proxy_service_1 = require("../services/engine-data-plane-proxy.service");
const engine_v2_dispatcher_service_1 = require("../services/engine-v2-dispatcher.service");
const UNSUPPORTED_TRIGGERS = new Set([
    n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE,
    n8n_workflow_1.FORM_NODE_TYPE,
    n8n_workflow_1.FORM_TRIGGER_NODE_TYPE,
    constants_1.MCP_TRIGGER_NODE_TYPE,
    n8n_workflow_1.MICROSOFT_AGENT365_TRIGGER_NODE_TYPE,
    n8n_workflow_1.WAIT_NODE_TYPE,
]);
const SUPPORTED_RESPONSE_MODES = new Set([
    'onReceived',
    'lastNode',
    'responseNode',
    'streaming',
]);
let EngineV2Webhooks = class EngineV2Webhooks {
    constructor(dispatcher, proxy) {
        this.dispatcher = dispatcher;
        this.proxy = proxy;
    }
    handles(workflowData, executionMode) {
        return this.dispatcher.handlesWorkflow(workflowData, executionMode);
    }
    assertSupported({ workflowStartNode, responseMode, executionId }) {
        if (!this.proxy.isAvailable()) {
            throw new n8n_workflow_1.UserError('Engine v2 is not available. Enable the `engine-v2` module with N8N_ENABLED_MODULES.');
        }
        if (executionId !== undefined) {
            throw new n8n_workflow_1.UserError('Engine v2 cannot resume a waiting execution yet.');
        }
        if (UNSUPPORTED_TRIGGERS.has(workflowStartNode.type)) {
            throw new n8n_workflow_1.UserError(`Engine v2 cannot run the "${workflowStartNode.name}" trigger yet.`);
        }
        if ((0, n8n_workflow_1.classifyTriggerIdentity)(workflowStartNode.type, workflowStartNode.parameters)
            .providesExternalIdentity) {
            throw new n8n_workflow_1.UserError(`Engine v2 cannot run the "${workflowStartNode.name}" trigger yet, because it takes credentials from the request.`);
        }
        if (!SUPPORTED_RESPONSE_MODES.has(responseMode)) {
            throw new n8n_workflow_1.UserError(`Engine v2 does not support the '${responseMode}' response mode yet. Respond immediately instead.`);
        }
        if (responseMode === 'streaming' && this.keepsRawBody(workflowStartNode)) {
            throw new n8n_workflow_1.UserError(`Engine v2 cannot stream a response for the "${workflowStartNode.name}" trigger with the Raw Body option yet.`);
        }
    }
    keepsRawBody(node) {
        const options = node.parameters.options;
        if (!(0, is_record_1.isRecord)(options))
            return false;
        return options.rawBody !== undefined && options.rawBody !== false;
    }
    async toRun(outcome, executionMode) {
        const runData = {};
        let lastNodeExecuted = outcome.status === 'failed' ? outcome.nodeName : undefined;
        if (outcome.status === 'completed' && outcome.lastNode) {
            const { fromStepInputs } = await import('@n8n/node-engine-compatibility');
            lastNodeExecuted = outcome.lastNode.nodeName;
            runData[lastNodeExecuted] = [
                {
                    startTime: Date.now(),
                    executionIndex: 0,
                    source: [],
                    executionTime: 0,
                    executionStatus: 'success',
                    data: { main: fromStepInputs(outcome.lastNode.outputs) },
                },
            ];
        }
        return {
            mode: executionMode,
            startedAt: new Date(),
            status: outcome.status === 'failed' ? 'error' : 'success',
            storedAt: 'db',
            data: (0, n8n_workflow_1.createRunExecutionData)({
                resultData: {
                    runData,
                    lastNodeExecuted,
                    error: outcome.status === 'failed'
                        ? new n8n_workflow_1.WorkflowOperationError(outcome.error?.message ?? 'The workflow failed')
                        : undefined,
                },
            }),
        };
    }
};
exports.EngineV2Webhooks = EngineV2Webhooks;
exports.EngineV2Webhooks = EngineV2Webhooks = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_v2_dispatcher_service_1.EngineV2Dispatcher, engine_data_plane_proxy_service_1.EngineDataPlaneProxyService])
], EngineV2Webhooks);
//# sourceMappingURL=engine-v2-webhooks.js.map