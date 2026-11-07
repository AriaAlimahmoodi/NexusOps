"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicProject = toPublicProject;
function toIsoString(value) {
    return typeof value === 'string' ? value : value.toISOString();
}
function toPublicProject(project) {
    return {
        id: project.id,
        name: project.name,
        type: project.type,
        icon: project.icon,
        description: project.description,
        customTelemetryTags: project.customTelemetryTags,
        creatorId: project.creatorId,
        createdAt: toIsoString(project.createdAt),
        updatedAt: toIsoString(project.updatedAt),
    };
}
//# sourceMappingURL=project.mapper.js.map