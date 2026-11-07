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
exports.InstanceAiPreferenceCardService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const telemetry_1 = require("@n8n/telemetry");
const ai_preference_service_1 = require("../../services/ai-preference.service");
const ai_preference_write_1 = require("../../services/ai-preference-write");
const telemetry_2 = require("../../telemetry");
const in_process_event_bus_1 = require("./event-bus/in-process-event-bus");
let InstanceAiPreferenceCardService = class InstanceAiPreferenceCardService {
    constructor(aiPreferenceService, eventBus, telemetry) {
        this.aiPreferenceService = aiPreferenceService;
        this.eventBus = eventBus;
        this.telemetry = telemetry;
    }
    async undo(user, threadId, preferenceId, { runId, toolCallId }) {
        const removed = await this.aiPreferenceService.getById(user, preferenceId);
        await this.aiPreferenceService.delete(user, preferenceId);
        const event = this.publish(threadId, {
            type: 'preference-card',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            payload: { toolCallId, preferenceId, state: 'undone' },
        });
        const { scope } = (0, api_types_1.aiPreferenceTargetOf)(removed);
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_DELETED_PREFERENCES, {
            user_id: user.id,
            count: 1,
            source: 'rejected',
            scope_types: [scope],
            surface: 'aia',
            seconds_since_saved: (0, ai_preference_write_1.secondsSinceSaved)(removed),
        });
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_RESOLVED, {
            user_id: user.id,
            surface: 'aia',
            outcome: 'rejected',
            scope_type: scope,
            text_length: removed.content.length,
        });
        return event;
    }
    async edit(user, threadId, preferenceId, { runId, toolCallId, content, scope, projectId, userId, }) {
        const before = (0, api_types_1.aiPreferenceTargetOf)(await this.aiPreferenceService.getById(user, preferenceId));
        const named = scope !== undefined;
        const preference = await this.aiPreferenceService.update(user, preferenceId, {
            content,
            scope,
            projectId,
            userId,
        });
        const after = (0, api_types_1.aiPreferenceTargetOf)(preference);
        const moved = named && (before.scope !== after.scope || preference.projectId !== projectIdOf(before));
        const event = this.publish(threadId, {
            type: 'preference-card',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            payload: {
                toolCallId,
                preferenceId,
                state: 'edited',
                content: preference.content,
                scope: after.scope,
                projectId: preference.projectId,
            },
        });
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_RESOLVED, {
            user_id: user.id,
            surface: 'aia',
            outcome: 'accepted_after_edit',
            scope_type: after.scope,
            text_length: preference.content.length,
        });
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_UPDATED_PREFERENCE, {
            user_id: user.id,
            scope_type: after.scope,
            text_length: preference.content.length,
            scope_changed: moved,
            ...(preference.projectId ? { project_id: preference.projectId } : {}),
            surface: 'aia',
        });
        if (moved) {
            this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_SCOPE_ACCEPTED, {
                user_id: user.id,
                surface: 'aia',
                offered_scope: before.scope,
                accepted_scope: after.scope,
                scope_changed: true,
            });
        }
        return { preference, event };
    }
    publish(threadId, event) {
        this.eventBus.publish(threadId, event);
        return event;
    }
};
exports.InstanceAiPreferenceCardService = InstanceAiPreferenceCardService;
exports.InstanceAiPreferenceCardService = InstanceAiPreferenceCardService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [ai_preference_service_1.AiPreferenceService, in_process_event_bus_1.InProcessEventBus, telemetry_2.Telemetry])
], InstanceAiPreferenceCardService);
function projectIdOf(target) {
    return target.scope === 'project' ? target.projectId : null;
}
//# sourceMappingURL=instance-ai-preference-card.service.js.map