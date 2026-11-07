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
exports.AgentSaveCompletionService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const agent_modification_telemetry_service_1 = require("./agent-modification-telemetry.service");
const agent_update_broadcaster_1 = require("./agent-update-broadcaster");
let AgentSaveCompletionService = class AgentSaveCompletionService {
    constructor(eventService, broadcaster, modificationTelemetry) {
        this.eventService = eventService;
        this.broadcaster = broadcaster;
        this.modificationTelemetry = modificationTelemetry;
    }
    async configurationSaved(event, pushRef, emitSetupCompleted) {
        await this.clearRuntimes(event.agent.id);
        this.eventService.emit('agent-saved', { agentId: event.agent.id });
        this.notify(event, pushRef);
        await emitSetupCompleted?.();
    }
    async bodySaved(event, pushRef, recordTelemetry = true) {
        await this.clearRuntimes(event.agent.id);
        this.notify(event, pushRef, recordTelemetry);
    }
    taskSaved(event, pushRef) {
        this.notify(event, pushRef);
    }
    notify(event, pushRef, recordTelemetry = true) {
        this.broadcaster.notify({ projectId: event.projectId, agentId: event.agent.id, source: event.by }, pushRef);
        if (recordTelemetry)
            this.modificationTelemetry.record(event);
    }
    async clearRuntimes(agentId) {
        const { AgentRuntimeCacheService } = await import('./agent-runtime-cache.service.js');
        di_1.Container.get(AgentRuntimeCacheService).clearRuntimes(agentId);
    }
};
exports.AgentSaveCompletionService = AgentSaveCompletionService;
exports.AgentSaveCompletionService = AgentSaveCompletionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, agent_update_broadcaster_1.AgentUpdateBroadcaster, agent_modification_telemetry_service_1.AgentModificationTelemetryService])
], AgentSaveCompletionService);
//# sourceMappingURL=agent-save-completion.service.js.map