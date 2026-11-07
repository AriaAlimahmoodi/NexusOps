"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAgentWorkflowRefs = extractAgentWorkflowRefs;
function extractAgentWorkflowRefs(config) {
    return (config?.tools ?? []).filter((tool) => tool.type === 'workflow');
}
//# sourceMappingURL=extract-agent-workflow-refs.js.map