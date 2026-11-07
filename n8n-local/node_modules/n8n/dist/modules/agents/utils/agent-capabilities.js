"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countAgentCapabilities = countAgentCapabilities;
exports.totalAgentCapabilities = totalAgentCapabilities;
exports.configuredCapabilityKinds = configuredCapabilityKinds;
exports.capabilityCountTelemetryProperties = capabilityCountTelemetryProperties;
exports.isUnconfiguredAgent = isUnconfiguredAgent;
const api_types_1 = require("@n8n/api-types");
function countAgentCapabilities(config, integrations = config?.integrations ?? []) {
    const size = (entries) => entries?.length ?? 0;
    return {
        tool: size(config?.tools),
        skill: size(config?.skills),
        subAgent: size(config?.subAgents?.agents),
        mcpServer: size(config?.mcpServers?.filter((server) => server.url.trim() !== '')),
        vectorStore: size(config?.vectorStores),
        task: size(config?.tasks),
        channel: integrations.filter((integration) => integration.type !== api_types_1.N8N_CHAT_INTEGRATION_TYPE && !(0, api_types_1.isDraftIntegration)(integration)).length,
    };
}
function totalAgentCapabilities(counts) {
    return Object.values(counts).reduce((total, count) => total + count, 0);
}
function configuredCapabilityKinds(counts) {
    return Object.keys(counts)
        .filter((kind) => counts[kind] > 0)
        .sort();
}
function capabilityCountTelemetryProperties(counts) {
    return {
        capability_kinds: configuredCapabilityKinds(counts),
        capability_count: totalAgentCapabilities(counts),
        tool_count: counts.tool,
        skill_count: counts.skill,
        sub_agent_count: counts.subAgent,
        mcp_server_count: counts.mcpServer,
        vector_store_count: counts.vectorStore,
        task_count: counts.task,
        trigger_count: counts.channel,
    };
}
function isUnconfiguredAgent(schema, integrations) {
    if (!schema)
        return true;
    if (schema.model?.trim() || schema.instructions?.trim())
        return false;
    return totalAgentCapabilities(countAgentCapabilities(schema, integrations)) === 0;
}
//# sourceMappingURL=agent-capabilities.js.map