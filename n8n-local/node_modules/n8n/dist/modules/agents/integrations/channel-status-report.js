"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChannelStatusReport = buildChannelStatusReport;
const api_types_1 = require("@n8n/api-types");
function buildChannelStatusReport(integrations, activeVersionId, statuses, isLive, publishedIntegrations = []) {
    const liveByChannel = new Map();
    for (const row of statuses) {
        if (!isLive(row))
            continue;
        const key = channelKey(row.integrationType, row.credentialId);
        liveByChannel.set(key, [...(liveByChannel.get(key) ?? []), row]);
    }
    const entries = (integrations ?? [])
        .filter(api_types_1.isCredentialAgentIntegration)
        .filter((integration) => !(0, api_types_1.isDraftIntegration)(integration))
        .map((integration) => {
        const rows = liveByChannel.get(channelKey(integration.type, integration.credentialId)) ?? [];
        const status = resolveStatus(activeVersionId, rows);
        const failure = status === 'error' ? mostRecentFailure(rows) : undefined;
        return {
            type: integration.type,
            credentialId: integration.credentialId,
            ...('settings' in integration ? { settings: integration.settings } : {}),
            ...(integration.approval ? { approval: integration.approval } : {}),
            status,
            ...(failure?.errorMessage ? { errorMessage: failure.errorMessage } : {}),
        };
    });
    const draftChat = integrations?.some((integration) => integration.type === 'n8n_chat') ?? false;
    const publishedChat = activeVersionId !== null &&
        publishedIntegrations.some((integration) => integration.type === 'n8n_chat');
    if (draftChat || publishedChat) {
        entries.push({ type: 'n8n_chat', status: publishedChat ? 'connected' : 'configured' });
    }
    return { status: rollUp(entries), integrations: entries };
}
function channelKey(integrationType, credentialId) {
    return `${integrationType}:${credentialId}`;
}
function resolveStatus(activeVersionId, rows) {
    if (activeVersionId === null)
        return 'configured';
    if (rows.length === 0)
        return 'starting';
    if (rows.some((row) => row.status === 'error'))
        return 'error';
    return 'connected';
}
function mostRecentFailure(rows) {
    return rows
        .filter((row) => row.status === 'error')
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.hostId.localeCompare(b.hostId))[0];
}
function rollUp(entries) {
    if (entries.length === 0)
        return 'disconnected';
    const statuses = entries.map((entry) => entry.status);
    if (statuses.every((status) => status === 'configured'))
        return 'configured';
    if (statuses.every((status) => status === 'connected'))
        return 'connected';
    if (statuses.some((status) => status === 'connected'))
        return 'partial';
    return statuses.some((status) => status === 'error') ? 'error' : 'partial';
}
//# sourceMappingURL=channel-status-report.js.map