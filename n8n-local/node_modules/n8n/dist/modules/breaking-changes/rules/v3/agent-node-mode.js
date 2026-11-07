"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_NODE_TYPE = void 0;
exports.getAgentNodesBelowFirstSupportedVersion = getAgentNodesBelowFirstSupportedVersion;
exports.getRemovedAgentMode = getRemovedAgentMode;
exports.AGENT_NODE_TYPE = '@n8n/n8n-nodes-langchain.agent';
const FIRST_SUPPORTED_VERSION = 2;
const REMOVED_AGENT_MODES = {
    conversationalAgent: 'Conversational Agent',
    openAiFunctionsAgent: 'OpenAI Functions Agent',
    planAndExecuteAgent: 'Plan and Execute Agent',
    reActAgent: 'ReAct Agent',
    sqlAgent: 'SQL Agent',
};
function resolveAgentMode(node) {
    if (typeof node.parameters?.agent === 'string')
        return node.parameters.agent;
    return node.typeVersion <= 1.5 ? 'conversationalAgent' : 'toolsAgent';
}
function getAgentNodesBelowFirstSupportedVersion(nodesGroupedByType) {
    return (nodesGroupedByType.get(exports.AGENT_NODE_TYPE) ?? []).filter((node) => node.typeVersion < FIRST_SUPPORTED_VERSION);
}
function getRemovedAgentMode(node) {
    return REMOVED_AGENT_MODES[resolveAgentMode(node)];
}
//# sourceMappingURL=agent-node-mode.js.map