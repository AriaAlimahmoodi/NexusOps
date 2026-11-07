"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findExportableProjects = findExportableProjects;
const package_export_errors_1 = require("../package-export.errors");
async function findExportableProjects(projectService, user, projectIds) {
    if (projectIds.length === 0)
        return [];
    const projects = await projectService.findProjectsByIdsForUser(user, projectIds, [
        'project:export',
    ]);
    await (0, package_export_errors_1.assertEveryRequestedEntityAccessible)('project', projectIds, projects, async (ids) => await projectService.findExistingProjectIds(ids));
    return projects;
}
//# sourceMappingURL=project-export-access.js.map