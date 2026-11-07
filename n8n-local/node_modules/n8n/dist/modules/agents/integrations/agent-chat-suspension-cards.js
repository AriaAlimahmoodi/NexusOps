"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIntegrationActionSuspendPayload = isIntegrationActionSuspendPayload;
exports.isApprovalSuspendPayload = isApprovalSuspendPayload;
exports.buildSuspendCardPayload = buildSuspendCardPayload;
const is_record_1 = require("@n8n/utils/is-record");
function isIntegrationActionSuspendPayload(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        value.type === 'integration_action');
}
function isApprovalSuspendPayload(value) {
    return ((0, is_record_1.isRecord)(value) &&
        value.type === 'approval' &&
        typeof value.toolName === 'string' &&
        value.toolName.length > 0);
}
function isSuspendCardComponent(value) {
    return (0, is_record_1.isRecord)(value) && typeof value.type === 'string' && value.type.length > 0;
}
function isSuspendCardPayload(value) {
    if (!(0, is_record_1.isRecord)(value) || !Array.isArray(value.components) || value.components.length === 0) {
        return false;
    }
    return value.components.every(isSuspendCardComponent);
}
function getApprovalToolLabel(payload) {
    return typeof payload.displayName === 'string' && payload.displayName.length > 0
        ? payload.displayName
        : payload.toolName;
}
function buildApprovalCardPayload(payload) {
    const toolLabel = getApprovalToolLabel(payload);
    const fields = [{ label: 'Tool', value: toolLabel }];
    return {
        title: 'Approval required',
        components: [
            { type: 'section', text: `The agent wants to run this tool: ${toolLabel}` },
            { type: 'fields', fields },
            { type: 'button', label: 'Approve', value: 'true', style: 'primary' },
            ...(payload.supportsSessionApproval === true
                ? [{ type: 'button', label: 'Allow for this session', value: 'session' }]
                : []),
            { type: 'button', label: 'Deny', value: 'false', style: 'danger' },
        ],
    };
}
function buildSuspendCardPayload(payload) {
    if (isIntegrationActionSuspendPayload(payload)) {
        return undefined;
    }
    if (isApprovalSuspendPayload(payload)) {
        return buildApprovalCardPayload(payload);
    }
    if (isSuspendCardPayload(payload)) {
        return payload;
    }
    const message = (0, is_record_1.isRecord)(payload) && 'message' in payload
        ? String(payload.message)
        : 'Action required — approve or deny?';
    return {
        title: message,
        components: [
            { type: 'button', label: 'Approve', value: 'true', style: 'primary' },
            { type: 'button', label: 'Deny', value: 'false', style: 'danger' },
        ],
    };
}
//# sourceMappingURL=agent-chat-suspension-cards.js.map