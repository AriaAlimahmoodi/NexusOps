"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTriggerResourceResolverBase = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const resource_gate_1 = require("../resource-gate");
const utils_1 = require("./utils");
class ChatTriggerResourceResolverBase {
    constructor() {
        this.scopes = utils_1.CHAT_TRIGGER_SCOPES;
    }
    async resolveByUrl(resourceUrl) {
        const pathname = (0, utils_1.webhookPathFromResourceUrl)(resourceUrl, this.baseUrl, this.logger);
        if (pathname === undefined)
            return undefined;
        return await this.resolveByPath(pathname);
    }
    async resolveByPath(pathname) {
        const { endpoint } = this;
        if (!pathname.startsWith(`/${endpoint}/`)) {
            return undefined;
        }
        const path = (0, utils_1.trimSlashes)(pathname.slice(endpoint.length + 1));
        if (!path.endsWith(`/${n8n_workflow_1.CHAT_TRIGGER_PATH_SUFFIX}`)) {
            return undefined;
        }
        const found = await this.findChatTrigger(path);
        if (!found) {
            return undefined;
        }
        const { node, workflowId, workflowName } = found;
        if (!(0, utils_1.isOAuthProtectedChatTrigger)(node, this.config.chatTrigger.disablePublicChat)) {
            return undefined;
        }
        const resourceUrl = `${(0, utils_1.trimTrailingSlash)(this.baseUrl)}/${endpoint}/${path}`;
        const audiences = [resourceUrl];
        const requireExecute = node.parameters.requireExecuteAccess === true;
        return {
            id: `workflow-chat:${workflowId}:${path}`,
            isFirstParty: true,
            surface: 'trigger',
            getResourceUrl: () => resourceUrl,
            getAudiences: () => audiences,
            getAllowedRedirectUris: async () => [resourceUrl],
            getAcceptedSourceIds: () => (0, utils_1.acceptedTrustedSourceIds)(node),
            scopes: utils_1.CHAT_TRIGGER_SCOPES,
            displayName: workflowName,
            uiHints: utils_1.CHAT_TRIGGER_CONSENT_HINTS,
            ...(0, resource_gate_1.triggerResourceGate)(this.workflowFinderService, {
                audiences,
                executeAccessWorkflowId: requireExecute ? workflowId : undefined,
            }),
        };
    }
}
exports.ChatTriggerResourceResolverBase = ChatTriggerResourceResolverBase;
//# sourceMappingURL=chat-trigger-resource.base.js.map