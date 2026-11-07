"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const provisioning_service_ee_1 = require("../../../modules/provisioning.ee/provisioning.service.ee");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const project_service_ee_1 = require("../../../services/project.service.ee");
const tags = ['Projects'];
const toProjectPublicDto = (project) => ({
    id: project.id,
    name: project.name,
    type: project.type,
    icon: project.icon,
    description: project.description,
    customTelemetryTags: project.customTelemetryTags,
    creatorId: project.creatorId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
});
const toProjectMemberPublicDto = (relation) => ({
    id: relation.user.id,
    email: relation.user.email,
    firstName: relation.user.firstName,
    lastName: relation.user.lastName,
    createdAt: relation.user.createdAt.toISOString(),
    updatedAt: relation.user.updatedAt.toISOString(),
    role: relation.role?.slug ?? null,
});
let ProjectsPublicController = class ProjectsPublicController {
    constructor(projectService, provisioningService) {
        this.projectService = projectService;
        this.provisioningService = provisioningService;
    }
    async getProjects(_req, _res, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const { projects, count } = await this.projectService.getProjectsAndCount({ offset, limit });
        return {
            data: projects.map(toProjectPublicDto),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async createProject(req, _res, body) {
        const project = await this.projectService.createTeamProject(req.user, { name: body.name, icon: body.icon ?? undefined }, { id: body.id, description: body.description, customTelemetryTags: body.customTelemetryTags });
        const scopes = await this.projectService.getProjectScopesForUser(req.user, project.id);
        return { ...toProjectPublicDto(project), role: 'project:admin', scopes };
    }
    async updateProject(req, _res, projectId, body) {
        await this.projectService.updateProject(req.user, projectId, { name: body.name });
    }
    async deleteProject(req, _res, projectId, _query) {
        await this.projectService.deleteProject(req.user, projectId);
    }
    async getProjectUsers(req, _res, projectId, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const project = await this.projectService.getProjectWithScope(req.user, projectId, [
            'project:list',
        ]);
        if (!project) {
            throw new errors_1.NotFoundError(`Could not find project with ID "${projectId}"`);
        }
        const { members, count } = await this.projectService.getProjectMembersAndCount(projectId, {
            offset,
            limit,
        });
        return {
            data: members.map(toProjectMemberPublicDto),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async addUsersToProject(req, _res, projectId, body) {
        await this.assertProjectRolesNotManaged();
        await this.projectService.addUsersToProject(req.user, projectId, body.relations);
    }
    async changeUserRoleInProject(req, _res, projectId, userId, body) {
        await this.assertProjectRolesNotManaged();
        await this.projectService.changeUserRoleInProject(req.user, projectId, userId, body.role);
    }
    async deleteUserFromProject(req, _res, projectId, userId) {
        await this.assertProjectRolesNotManaged();
        await this.projectService.deleteUserFromProject(req.user, projectId, userId);
    }
    async assertProjectRolesNotManaged() {
        if (await this.provisioningService.isProjectRoleManaged()) {
            throw new errors_1.ForbiddenError('Project roles are managed automatically and cannot be changed manually');
        }
    }
};
exports.ProjectsPublicController = ProjectsPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('project:list'),
    (0, decorators_1.ApiSummary)('Retrieve projects'),
    (0, decorators_1.ApiDescription)('Retrieve projects from your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.ProjectListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListProjectsQueryPublicDto]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "getProjects", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('project:create'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('project:create'),
    (0, decorators_1.ApiSummary)('Create a project'),
    (0, decorators_1.ApiDescription)('Create a team project on your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.CreatedProjectPublicDto),
    (0, decorators_1.ApiErrorResponse)(409, {
        description: 'A project with this ID exists already. The request does not change the existing project or its members.',
    }),
    (0, decorators_1.ApiErrorResponse)(400),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateProjectPublicDto]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "createProject", null);
__decorate([
    (0, decorators_1.Put)('/:projectId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('project:update'),
    (0, decorators_1.ApiSummary)('Update a project'),
    (0, decorators_1.ApiDescription)('Update a project on your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateProjectPublicDto]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "updateProject", null);
__decorate([
    (0, decorators_1.Delete)('/:projectId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('project:delete'),
    (0, decorators_1.ApiSummary)('Delete a project'),
    (0, decorators_1.ApiDescription)('Delete a project from your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.DeleteProjectQueryPublicDto]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "deleteProject", null);
__decorate([
    (0, decorators_1.Get)('/:projectId/users'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('user:list'),
    (0, decorators_1.ApiSummary)('List project members'),
    (0, decorators_1.ApiDescription)('Returns a list of all members of a project including their role. Requires user:list scope.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.ProjectMemberListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListProjectMembersQueryPublicDto]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "getProjectUsers", null);
__decorate([
    (0, decorators_1.Post)('/:projectId/users'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('project:manageMembers'),
    (0, decorators_1.ApiSummary)('Add one or more users to a project'),
    (0, decorators_1.ApiDescription)('Add one or more users to a project on your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AddProjectMembersPublicDto]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "addUsersToProject", null);
__decorate([
    (0, decorators_1.Patch)('/:projectId/users/:userId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('project:manageMembers'),
    (0, decorators_1.ApiSummary)("Change a user's role in a project"),
    (0, decorators_1.ApiDescription)("Change a user's role in a project."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, (0, decorators_1.Param)('userId', api_types_1.userIdParamSchema)),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.ChangeProjectMemberRolePublicDto]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "changeUserRoleInProject", null);
__decorate([
    (0, decorators_1.Delete)('/:projectId/users/:userId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN),
    (0, decorators_1.ApiKeyScope)('project:manageMembers'),
    (0, decorators_1.ApiSummary)('Delete a user from a project'),
    (0, decorators_1.ApiDescription)('Delete a user from a project on your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, (0, decorators_1.Param)('userId', api_types_1.userIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsPublicController.prototype, "deleteUserFromProject", null);
exports.ProjectsPublicController = ProjectsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/projects'),
    __metadata("design:paramtypes", [project_service_ee_1.ProjectService, provisioning_service_ee_1.ProvisioningService])
], ProjectsPublicController);
//# sourceMappingURL=projects.public.controller.js.map