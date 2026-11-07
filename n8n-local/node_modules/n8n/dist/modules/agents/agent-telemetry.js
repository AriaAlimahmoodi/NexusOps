"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentTurnMetrics = buildAgentTurnMetrics;
exports.buildAgentCapabilityTelemetryProperties = buildAgentCapabilityTelemetryProperties;
exports.buildAgentConfigurationTelemetry = buildAgentConfigurationTelemetry;
exports.buildAgentConfigurationTelemetryFromConfig = buildAgentConfigurationTelemetryFromConfig;
const agent_document_1 = require("./json-config/agent-document");
const agent_capabilities_1 = require("./utils/agent-capabilities");
function buildAgentTurnMetrics(record) {
    return {
        latency_ms: record.duration,
        cost: record.totalCost ?? 0,
        token_count: record.usage?.totalTokens ?? 0,
        tool_call_count: record.timeline.filter((event) => event.type === 'tool-call').length,
    };
}
function buildAgentCapabilityTelemetryProperties(config, integrations) {
    const counts = (0, agent_capabilities_1.countAgentCapabilities)(config, integrations);
    const { model, tool_types } = buildAgentConfigurationTelemetryFromConfig(config, integrations);
    return { ...(0, agent_capabilities_1.capabilityCountTelemetryProperties)(counts), model, tool_types };
}
function buildAgentConfigurationTelemetry({ agent, skillRefs, }) {
    return buildAgentConfigurationTelemetryFromConfig(agent.schema ? (0, agent_document_1.toAgentDocument)(agent.schema, skillRefs) : null, agent.integrations);
}
function buildAgentConfigurationTelemetryFromConfig(config, integrations = []) {
    const channels = uniqueSorted([
        ...(integrations ?? []).map((integration) => integration.type),
        ...(config?.integrations ?? []).map((integration) => integration.type),
    ]);
    const providerToolCount = Object.keys(config?.providerTools ?? {}).length;
    const hasWebSearch = config?.config?.webSearch?.enabled === true;
    const mcpServerCount = config?.mcpServers?.length ?? 0;
    const subAgentCount = config?.subAgents?.agents?.length ?? 0;
    const toolTypes = new Set(config?.tools?.map((tool) => tool.type) ?? []);
    if (mcpServerCount > 0)
        toolTypes.add('mcp');
    if (providerToolCount > 0)
        toolTypes.add('provider');
    if (hasWebSearch)
        toolTypes.add('web_search');
    if (subAgentCount > 0)
        toolTypes.add('subagent');
    return {
        model: config?.model || null,
        channels,
        tool_types: uniqueSorted([...toolTypes]),
        tool_count: (config?.tools?.length ?? 0) +
            mcpServerCount +
            providerToolCount +
            (hasWebSearch ? 1 : 0) +
            subAgentCount,
        num_skills: config?.skills?.length ?? 0,
        memory_type: getMemoryType(config),
    };
}
function getMemoryType(config) {
    const memory = config?.memory;
    if (!memory?.enabled)
        return 'none';
    const hasObservationalMemory = memory.observationalMemory?.enabled !== false;
    const hasEpisodicMemory = memory.episodicMemory?.enabled === true;
    if (hasObservationalMemory && hasEpisodicMemory)
        return 'n8n_observational_episodic';
    if (hasObservationalMemory)
        return 'n8n_observational';
    if (hasEpisodicMemory)
        return 'n8n_episodic';
    return 'n8n';
}
function uniqueSorted(values) {
    return [...new Set(values)].sort();
}
//# sourceMappingURL=agent-telemetry.js.map