"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentPreviewPath = buildAgentPreviewPath;
function buildAgentPreviewPath(projectId, agentId) {
    const encodedProjectId = encodeURIComponent(projectId);
    const encodedAgentId = encodeURIComponent(agentId);
    return `/projects/${encodedProjectId}/agents/${encodedAgentId}?openPreview=true`;
}
//# sourceMappingURL=agent-builder-preview-path.js.map