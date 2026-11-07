"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_TRIGGER_CONSENT_HINTS = exports.CHAT_TRIGGER_SCOPES = exports.WEBHOOK_TRIGGER_SCOPES = exports.FORM_TRIGGER_CONSENT_HINTS = exports.FORM_TRIGGER_SCOPES = exports.WORKFLOW_MCP_TRIGGER_SCOPES = void 0;
exports.isOAuthProtectedChatTrigger = isOAuthProtectedChatTrigger;
exports.acceptedTrustedSourceIds = acceptedTrustedSourceIds;
exports.trimTrailingSlash = trimTrailingSlash;
exports.trimSlashes = trimSlashes;
exports.resourceUrlToWebhookPath = resourceUrlToWebhookPath;
exports.webhookPathFromResourceUrl = webhookPathFromResourceUrl;
exports.webhookResourcePath = webhookResourcePath;
exports.methodQueryString = methodQueryString;
exports.parseMethodParam = parseMethodParam;
exports.webhookAllowsBrowserFlow = webhookAllowsBrowserFlow;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../../../modules/inbound-auth-core/constants");
exports.WORKFLOW_MCP_TRIGGER_SCOPES = [];
exports.FORM_TRIGGER_SCOPES = [];
exports.FORM_TRIGGER_CONSENT_HINTS = {
    icon: 'square-pen',
    consentType: 'form',
};
exports.WEBHOOK_TRIGGER_SCOPES = [];
exports.CHAT_TRIGGER_SCOPES = [];
exports.CHAT_TRIGGER_CONSENT_HINTS = {
    icon: 'node:chat-trigger',
    consentType: 'chat',
};
function isOAuthProtectedChatTrigger(node, disablePublicChat) {
    const mode = node.parameters.mode ?? 'hostedChat';
    return (node.type === n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE &&
        !node.disabled &&
        !disablePublicChat &&
        node.parameters.public === true &&
        mode === 'hostedChat' &&
        node.parameters.authentication === 'n8nUserAuth');
}
function acceptedTrustedSourceIds(node) {
    const { trustedSource } = node.parameters;
    return [
        typeof trustedSource === 'string' && trustedSource ? trustedSource : constants_1.SYSTEM_TRUSTED_SOURCE_ID,
    ];
}
function trimTrailingSlash(path) {
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return path;
}
function trimSlashes(path) {
    if (path.startsWith('/')) {
        path = path.slice(1);
    }
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return path;
}
function resourceUrlToWebhookPath(resourceUrl, webhookBaseUrl) {
    let url;
    try {
        url = new URL(resourceUrl);
    }
    catch {
        return undefined;
    }
    const base = new URL(webhookBaseUrl);
    if (url.origin !== base.origin) {
        return undefined;
    }
    const basePath = trimTrailingSlash(base.pathname);
    if (basePath && !url.pathname.startsWith(`${basePath}/`)) {
        return undefined;
    }
    return url.pathname.slice(basePath.length);
}
function webhookPathFromResourceUrl(resourceUrl, webhookBaseUrl, logger) {
    const pathname = resourceUrlToWebhookPath(resourceUrl, webhookBaseUrl);
    if (pathname === undefined) {
        logger.debug(`Resource URL is not under the webhook base URL: ${resourceUrl}`);
    }
    return pathname;
}
function webhookResourcePath(webhookPath, webhookId) {
    return webhookId ? `${webhookId}/${webhookPath}` : webhookPath;
}
function methodQueryString(method) {
    return `?method=${method.toUpperCase()}`;
}
function parseMethodParam(value) {
    const method = value?.trim().toUpperCase();
    return method === '' ? undefined : method;
}
function webhookAllowsBrowserFlow(node, requestedMethod) {
    const options = node.parameters.options;
    return (requestedMethod === 'GET' &&
        (0, n8n_workflow_1.resolveOAuthClientMode)(options?.oauthClient, node.typeVersion) !== 'bearer');
}
//# sourceMappingURL=utils.js.map