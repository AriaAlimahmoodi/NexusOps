"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_NODE_TYPES = void 0;
exports.checkAiGatewayEligibility = checkAiGatewayEligibility;
const utils_1 = require("../utils");
const OPERATION_ONLY = '__operation_only__';
exports.HTTP_NODE_TYPES = new Set([
    'n8n-nodes-base.httpRequest',
    '@n8n/n8n-nodes-langchain.toolHttpRequest',
    'n8n-nodes-base.httpRequestTool',
]);
function checkAiGatewayEligibility(node, credentialType, config, resolvedParameters) {
    const key = resolveNodeKey(node.type, config.nodes);
    if (!key)
        return { eligible: false, reason: 'nodeNotCovered' };
    if (!config.credentialTypes.includes(credentialType)) {
        return { eligible: false, reason: 'credentialTypeNotCovered' };
    }
    const minVersion = config.minNodeTypeVersion?.[key];
    if (minVersion !== undefined && node.typeVersion < minVersion) {
        return {
            eligible: false,
            reason: 'versionTooLow',
            details: `requires typeVersion >= ${minVersion}`,
        };
    }
    const hidden = config.hiddenNodeProperties?.[key];
    if (hidden?.length) {
        const params = node.parameters ?? {};
        const offending = hidden.find((prop) => hasNestedProperty(params, prop));
        if (offending !== undefined) {
            return {
                eligible: false,
                reason: 'hiddenPropertySet',
                details: `property "${offending}" is hidden when using Gateway credits`,
            };
        }
    }
    const actions = config.supportedActions?.[key];
    if (actions) {
        const params = resolvedParameters ?? node.parameters ?? {};
        const resource = typeof params.resource === 'string' ? params.resource : OPERATION_ONLY;
        const operation = typeof params.operation === 'string' ? params.operation : undefined;
        const allowedOps = actions[resource];
        if (!allowedOps || operation === undefined || !allowedOps.includes(operation)) {
            return {
                eligible: false,
                reason: 'unsupportedAction',
                details: resource === OPERATION_ONLY
                    ? `operation "${operation ?? ''}" not supported`
                    : `${resource}.${operation ?? ''} not supported`,
            };
        }
    }
    return { eligible: true };
}
function resolveNodeKey(nodeType, nodes) {
    if (nodes.includes(nodeType))
        return nodeType;
    const stripped = (0, utils_1.stripToolSuffix)(nodeType);
    if (stripped !== nodeType && nodes.includes(stripped))
        return stripped;
    return null;
}
function hasNestedProperty(value, key) {
    if (Array.isArray(value)) {
        return value.some((item) => hasNestedProperty(item, key));
    }
    if (value !== null && typeof value === 'object') {
        const record = value;
        if (Object.prototype.hasOwnProperty.call(record, key))
            return true;
        return Object.values(record).some((v) => hasNestedProperty(v, key));
    }
    return false;
}
//# sourceMappingURL=ai-gateway-eligibility.js.map