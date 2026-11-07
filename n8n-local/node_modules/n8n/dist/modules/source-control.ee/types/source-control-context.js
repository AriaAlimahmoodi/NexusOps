"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceControlContext = void 0;
const permissions_1 = require("@n8n/permissions");
class SourceControlContext {
    constructor(user, authorizedProjects, accessibleWorkflowIds) {
        this.user = user;
        this.authorizedProjects = authorizedProjects;
        this.accessibleWorkflowIds = accessibleWorkflowIds;
        this.authorizedProjectsByTeamId = new Map();
        this.authorizedProjectsByOwnerEmail = new Map();
        this._hasAccessToAllProjects = (0, permissions_1.hasGlobalScope)(this.user, 'project:update');
        this.authorizedProjectIds = new Set(this.authorizedProjects.map((project) => project.id));
        for (const project of this.authorizedProjects) {
            if (project.type === 'team') {
                this.authorizedProjectsByTeamId.set(project.id, project);
            }
            if (project.type === 'personal') {
                const ownerEmail = project.projectRelations?.find((relation) => relation.role.slug === permissions_1.PROJECT_OWNER_ROLE_SLUG)?.user?.email;
                if (ownerEmail) {
                    this.authorizedProjectsByOwnerEmail.set(ownerEmail, project);
                }
            }
        }
    }
    hasAccessToAllProjects() {
        return this._hasAccessToAllProjects;
    }
    canAccessProject(projectId) {
        return this._hasAccessToAllProjects || this.authorizedProjectIds.has(projectId);
    }
    findAuthorizedProjectByOwner(owner) {
        if (typeof owner === 'string') {
            return this.authorizedProjectsByOwnerEmail.get(owner);
        }
        if (owner.type === 'personal') {
            return this.authorizedProjectsByOwnerEmail.get(owner.personalEmail);
        }
        return this.authorizedProjectsByTeamId.get(owner.teamId);
    }
}
exports.SourceControlContext = SourceControlContext;
//# sourceMappingURL=source-control-context.js.map