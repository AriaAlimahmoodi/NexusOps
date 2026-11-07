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
exports.AgentModificationTelemetryService = exports.isUnconfiguredAgent = void 0;
exports.diffAgentConfigParts = diffAgentConfigParts;
exports.captureAgentMutation = captureAgentMutation;
exports.buildAgentMutationEvent = buildAgentMutationEvent;
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const telemetry_2 = require("../../telemetry");
const agent_telemetry_1 = require("./agent-telemetry");
const agent_document_1 = require("./json-config/agent-document");
const agent_capabilities_1 = require("./utils/agent-capabilities");
Object.defineProperty(exports, "isUnconfiguredAgent", { enumerable: true, get: function () { return agent_capabilities_1.isUnconfiguredAgent; } });
const CONFIG_PARTS = [
    'instructions',
    'model',
    'credential',
    'memory',
    'name',
    'description',
    'config',
    'tools',
    'providerTools',
    'skills',
    'tasks',
    'triggers',
    'subAgents',
    'mcpServers',
    'vectorStores',
];
function diffAgentConfigParts(previousSchema, nextSchema, previousIntegrations, nextIntegrations, sidecarChanges = {}) {
    return CONFIG_PARTS.filter((part) => {
        if (part === 'triggers')
            return !(0, isEqual_1.default)(previousIntegrations, nextIntegrations);
        if ((part === 'tools' || part === 'skills' || part === 'tasks') && sidecarChanges[part]) {
            return true;
        }
        return !(0, isEqual_1.default)(previousSchema?.[part], nextSchema?.[part]);
    });
}
function captureAgentMutation(agent, skillRefs) {
    const schema = agent.schema ? (0, agent_document_1.toAgentDocument)(agent.schema, skillRefs) : null;
    const integrations = agent.integrations ?? [];
    return { schema, integrations, wasUnconfigured: (0, agent_capabilities_1.isUnconfiguredAgent)(schema, integrations) };
}
function buildAgentMutationEvent(agent, skillRefs, projectId, context, previous, sidecarChanges) {
    const config = agent.schema ? (0, agent_document_1.toAgentDocument)(agent.schema, skillRefs) : null;
    return {
        agent,
        config,
        projectId,
        user: context.user,
        by: context.modifiedBy,
        changedParts: diffAgentConfigParts(previous.schema, config, previous.integrations, agent.integrations ?? [], sidecarChanges),
        wasUnconfigured: previous.wasUnconfigured,
    };
}
function modificationProperties({ agent, config, projectId, user, changedParts, }) {
    return {
        agent_id: agent.id,
        project_id: projectId,
        user_id: user.id,
        changed_parts: changedParts,
        ...(0, agent_telemetry_1.buildAgentCapabilityTelemetryProperties)(config, agent.integrations),
        has_published_version: Boolean(agent.activeVersionId),
    };
}
let AgentModificationTelemetryService = class AgentModificationTelemetryService {
    constructor(telemetry, eventService) {
        this.telemetry = telemetry;
        this.eventService = eventService;
    }
    record(event) {
        if (event.changedParts.length === 0)
            return;
        try {
            const { agent, config, by, wasUnconfigured } = event;
            if (wasUnconfigured && (0, agent_capabilities_1.isUnconfiguredAgent)(config, agent.integrations))
                return;
            if (by === 'builder') {
                this.eventService.emit('experiment-assistant-change-saved', {
                    userId: event.user.id,
                    at: Date.now(),
                });
            }
            const properties = modificationProperties(event);
            if (wasUnconfigured) {
                this.recordCreation(by, properties);
                return;
            }
            const entry = {
                user: telemetry_1.TELEMETRY_EVENT.AGENTS.USER_MODIFIED_AGENT,
                builder: telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_MODIFIED_AGENT,
                mcp: telemetry_1.TELEMETRY_EVENT.AGENTS.MCP_MODIFIED_AGENT,
            }[by];
            this.telemetry.track(entry, { ...properties, event_version: '1' });
        }
        catch {
        }
    }
    recordCreation(by, properties) {
        switch (by) {
            case 'user':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_CREATED_AGENT, {
                    ...properties,
                    event_version: '2',
                });
                return;
            case 'builder':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_CREATED_AGENT, {
                    ...properties,
                    event_version: '2',
                });
                return;
            case 'mcp':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.MCP_CREATED_AGENT, {
                    ...properties,
                    event_version: '1',
                });
                return;
        }
    }
};
exports.AgentModificationTelemetryService = AgentModificationTelemetryService;
exports.AgentModificationTelemetryService = AgentModificationTelemetryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [telemetry_2.Telemetry, backend_services_1.EventService])
], AgentModificationTelemetryService);
//# sourceMappingURL=agent-modification-telemetry.service.js.map