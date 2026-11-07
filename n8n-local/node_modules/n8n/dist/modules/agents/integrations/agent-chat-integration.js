"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatIntegrationRegistry = exports.AgentChatIntegration = exports.InboundAttachmentAccessError = void 0;
exports.onceStatusHandle = onceStatusHandle;
exports.postToUserOrThread = postToUserOrThread;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const integration_helpers_1 = require("./integration-helpers");
const integration_tool_definitions_1 = require("./integration-tool-definitions");
class InboundAttachmentAccessError extends n8n_workflow_1.UserError {
}
exports.InboundAttachmentAccessError = InboundAttachmentAccessError;
function onceStatusHandle(handle) {
    if (!handle)
        return undefined;
    let clearing;
    return {
        clearBeforeResponse: async () => {
            clearing ??= handle.clearBeforeResponse();
            await clearing;
        },
    };
}
async function postToUserOrThread(thread, user, payload) {
    try {
        const sent = await thread.postEphemeral(user, payload, { fallbackToDM: false });
        if (sent)
            return;
    }
    catch {
    }
    await thread.post(payload);
}
class AgentChatIntegration {
    constructor() {
        this.contextToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationContextQueryDefinitions)([
            'get_current_message_context',
            'get_current_subject',
        ]);
        this.actionToolDefinitions = (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)(['respond']);
        this.needsShortCallbackData = false;
        this.deleteActionMessageBeforeResume = true;
        this.defaultSessionIdleTimeoutMinutes = null;
        this.targetSuspensionCardAtActingUser = false;
        this.disableStreaming = false;
        this.singleStreamedRunPerTurn = false;
        this.internal = false;
        this.requiresChatInstance = true;
    }
    get contextQueries() {
        return this.contextToolDefinitions.map((definition) => definition.name);
    }
    get actions() {
        return this.actionToolDefinitions.map((definition) => definition.name);
    }
    requiresLeader(_options = { ingressEnabled: true }) {
        return false;
    }
    normalizeChannelId(channelId, _adapter) {
        return (0, integration_helpers_1.normalizePlatformId)(this.type, channelId);
    }
}
exports.AgentChatIntegration = AgentChatIntegration;
let ChatIntegrationRegistry = class ChatIntegrationRegistry {
    constructor() {
        this.integrations = new Map();
    }
    register(integration) {
        this.integrations.set(integration.type, integration);
    }
    get(type) {
        return this.integrations.get(type);
    }
    require(type) {
        const integration = this.integrations.get(type);
        if (!integration)
            throw new Error(`Unknown integration type: ${type}`);
        return integration;
    }
    list() {
        return [...this.integrations.values()];
    }
    listPublic() {
        return this.list().filter((integration) => !integration.internal);
    }
};
exports.ChatIntegrationRegistry = ChatIntegrationRegistry;
exports.ChatIntegrationRegistry = ChatIntegrationRegistry = __decorate([
    (0, di_1.Service)()
], ChatIntegrationRegistry);
//# sourceMappingURL=agent-chat-integration.js.map