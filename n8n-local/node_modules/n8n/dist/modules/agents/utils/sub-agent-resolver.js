"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUniqueSubAgents = resolveUniqueSubAgents;
async function resolveUniqueSubAgents({ refs, projectId, agentRepository, }) {
    const seen = new Set();
    const resolved = [];
    for (const ref of refs) {
        const { agentId } = ref;
        if (seen.has(agentId))
            continue;
        seen.add(agentId);
        const agent = await agentRepository.findByIdAndProjectId(agentId, projectId);
        resolved.push({ ...ref, agent });
    }
    return resolved;
}
//# sourceMappingURL=sub-agent-resolver.js.map