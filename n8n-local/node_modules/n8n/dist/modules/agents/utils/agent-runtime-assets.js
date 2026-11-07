"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentRuntimeAssets = getAgentRuntimeAssets;
function getAgentRuntimeAssets(agent, skills) {
    const toolDescriptors = {};
    const toolCodeByName = {};
    for (const [toolId, toolEntry] of Object.entries(agent.tools ?? {})) {
        toolDescriptors[toolId] = toolEntry.descriptor;
        toolCodeByName[toolEntry.descriptor.name] = toolEntry.code;
    }
    return { toolDescriptors, toolCodeByName, skills };
}
//# sourceMappingURL=agent-runtime-assets.js.map