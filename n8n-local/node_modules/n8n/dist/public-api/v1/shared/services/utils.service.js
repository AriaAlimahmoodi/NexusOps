"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertProjectScope = assertProjectScope;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const project_service_ee_1 = require("../../../../services/project.service.ee");
async function assertProjectScope(user, projectId, scopes) {
    const exists = await di_1.Container.get(db_1.ProjectRepository).findOneBy({ id: projectId });
    if (!exists) {
        throw new errors_1.NotFoundError(`Project with ID "${projectId}" not found`);
    }
    const project = await di_1.Container.get(project_service_ee_1.ProjectService).getProjectWithScope(user, projectId, scopes);
    if (!project)
        throw new errors_1.ForbiddenError();
}
//# sourceMappingURL=utils.service.js.map