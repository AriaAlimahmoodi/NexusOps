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
exports.AgentRunTracingService = void 0;
exports.modelIdFromSnapshot = modelIdFromSnapshot;
const agents_1 = require("@n8n/agents");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const otel_service_1 = require("../../modules/otel/otel.service");
const AGENTS_TRACER_NAME = '@n8n/agents';
function isWorkflowTracingMetadata(metadata) {
    return metadata.source === 'workflow';
}
let AgentRunTracingService = class AgentRunTracingService {
    constructor(agentsConfig, otelService) {
        this.agentsConfig = agentsConfig;
        this.otelService = otelService;
    }
    get enabled() {
        return this.agentsConfig.tracingEnabled;
    }
    async build(metadata) {
        if (!this.agentsConfig.tracingEnabled)
            return undefined;
        const attributes = {
            agent_id: metadata.agentId,
            project_id: metadata.projectId,
            thread_id: metadata.threadId,
            source: metadata.source,
            ...(metadata.userId ? { user_id: metadata.userId } : {}),
            ...(metadata.modelId ? { model_id: metadata.modelId } : {}),
        };
        if (isWorkflowTracingMetadata(metadata)) {
            if (metadata.executionId)
                attributes.execution_id = metadata.executionId;
            if (metadata.workflowId)
                attributes.workflow_id = metadata.workflowId;
            if (metadata.nodeId)
                attributes.node_id = metadata.nodeId;
        }
        const built = await new agents_1.Telemetry()
            .tracer(this.otelService.getTracer(AGENTS_TRACER_NAME))
            .metadata(attributes)
            .recordInputs(this.agentsConfig.tracingRecordInputs)
            .recordOutputs(this.agentsConfig.tracingRecordOutputs)
            .build();
        return isWorkflowTracingMetadata(metadata) && metadata.hasParentContext
            ? { ...built, rootAnchored: false }
            : built;
    }
};
exports.AgentRunTracingService = AgentRunTracingService;
exports.AgentRunTracingService = AgentRunTracingService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.AgentsConfig, otel_service_1.OtelService])
], AgentRunTracingService);
function modelIdFromSnapshot(model) {
    return model.provider && model.name ? `${model.provider}/${model.name}` : undefined;
}
//# sourceMappingURL=agent-run-tracing.service.js.map