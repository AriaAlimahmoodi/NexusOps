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
exports.ProjectController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const errors_1 = require("@n8n/errors");
const provisioning_service_ee_1 = require("../modules/provisioning.ee/provisioning.service.ee");
const project_service_ee_1 = require("../services/project.service.ee");
let ProjectController = class ProjectController {
    constructor(projectsService, provisioningService) {
        this.projectsService = projectsService;
        this.provisioningService = provisioningService;
    }
    async getAllProjects(req, res, payload) {
        const { projects, count } = await this.projectsService.getAccessibleProjectsAndCount(req.user, payload);
        if (payload.take !== undefined || payload.skip !== undefined) {
            const enriched = await this.projectsService.addUserScopes(req.user, projects);
            return res.json({ count, data: enriched });
        }
        return projects;
    }
    async getProjectCounts() {
        return await this.projectsService.getProjectCounts();
    }
    async getSharingCandidates(req, res, payload) {
        const { projects, count } = await this.projectsService.getShareableProjectsAndCount(req.user, payload);
        const enriched = await this.projectsService.addUserScopes(req.user, projects);
        return res.json({ count, data: enriched });
    }
    async createProject(req, _res, payload) {
        try {
            const project = await this.projectsService.createTeamProject(req.user, payload);
            return {
                ...project,
                role: 'project:admin',
                scopes: await this.projectsService.getProjectScopesForUser(req.user, project.id),
            };
        }
        catch (e) {
            if (e instanceof project_service_ee_1.TeamProjectOverQuotaError) {
                throw new errors_1.BadRequestError(e.message);
            }
            throw e;
        }
    }
    async getMyProjects(req, _res) {
        return await this.projectsService.getMyProjects(req.user);
    }
    async getPersonalProject(req) {
        const project = await this.projectsService.getPersonalProject(req.user);
        if (!project) {
            throw new errors_1.NotFoundError('Could not find a personal project for this user');
        }
        const scopes = await this.projectsService.getProjectScopesForUser(req.user, project.id);
        return {
            ...project,
            scopes,
            rolesManaged: false,
        };
    }
    async getProject(req, _res, projectId) {
        const project = await this.projectsService.getProject(projectId);
        const { id, name, icon, type, description, customTelemetryTags } = project;
        const [relations, rolesManaged, implicitMembers] = await Promise.all([
            this.projectsService.getProjectRelations(projectId),
            this.provisioningService.isProjectRoleManaged(),
            this.projectsService.getImplicitProjectMembers(project),
        ]);
        const myRelation = relations.find((r) => r.userId === req.user.id);
        return {
            id,
            name,
            icon,
            type,
            description,
            customTelemetryTags,
            creatorId: project.creatorId ?? null,
            relations: relations.map((r) => ({
                id: r.user.id,
                email: r.user.email,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
                role: r.role.slug,
            })),
            implicitMembers: implicitMembers.map((user) => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                globalRole: { slug: user.role.slug, displayName: user.role.displayName },
            })),
            scopes: [
                ...(0, permissions_1.combineScopes)({
                    global: (0, permissions_1.getAuthPrincipalScopes)(req.user),
                    ...(myRelation ? { project: myRelation.role.scopes.map((scope) => scope.slug) } : {}),
                }),
            ],
            rolesManaged,
        };
    }
    async updateProject(req, _res, payload, projectId) {
        await this.projectsService.updateProject(req.user, projectId, payload);
    }
    async assertProjectRolesNotManaged() {
        if (await this.provisioningService.isProjectRoleManaged()) {
            throw new errors_1.ForbiddenError('Project roles are managed automatically and cannot be changed manually');
        }
    }
    async addProjectUsers(req, res, projectId, payload) {
        await this.assertProjectRolesNotManaged();
        try {
            const { added, conflicts } = await this.projectsService.addUsersWithConflictSemantics(req.user, projectId, payload.relations);
            if (added.length > 0) {
                return conflicts.length > 0 ? res.status(201).json({ conflicts }) : res.status(201).send();
            }
            if (conflicts.length > 0)
                return res.status(409).json({ conflicts });
            return res.status(200).send();
        }
        catch (e) {
            if (e instanceof project_service_ee_1.UnlicensedProjectRoleError) {
                throw new errors_1.BadRequestError(e.message);
            }
            throw e;
        }
    }
    async changeProjectUserRole(req, res, projectId, userId, body) {
        await this.assertProjectRolesNotManaged();
        try {
            await this.projectsService.changeUserRoleInProject(req.user, projectId, userId, body.role);
            return res.status(204).send();
        }
        catch (e) {
            if (e instanceof project_service_ee_1.UnlicensedProjectRoleError) {
                throw new errors_1.BadRequestError(e.message);
            }
            throw e;
        }
    }
    async deleteProjectUser(req, res, projectId, userId) {
        await this.assertProjectRolesNotManaged();
        await this.projectsService.deleteUserFromProject(req.user, projectId, userId);
        return res.status(204).send();
    }
    async deleteProject(req, _res, query, projectId) {
        await this.projectsService.deleteProject(req.user, projectId, {
            migrateToProject: query.transferId,
        });
    }
};
exports.ProjectController = ProjectController;
__decorate([
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListProjectsQueryDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getAllProjects", null);
__decorate([
    (0, decorators_1.Get)('/count'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProjectCounts", null);
__decorate([
    (0, decorators_1.Get)('/sharing-candidates'),
    (0, decorators_1.GlobalScope)('user:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListProjectsQueryDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getSharingCandidates", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('project:create'),
    (0, decorators_1.Licensed)('feat:projectRole:admin'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "createProject", null);
__decorate([
    (0, decorators_1.Get)('/my-projects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getMyProjects", null);
__decorate([
    (0, decorators_1.Get)('/personal'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getPersonalProject", null);
__decorate([
    (0, decorators_1.Get)('/:projectId'),
    (0, decorators_1.ProjectScope)('project:read'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProject", null);
__decorate([
    (0, decorators_1.Patch)('/:projectId'),
    (0, decorators_1.ProjectScope)('project:update'),
    __param(2, decorators_1.Body),
    __param(3, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateProjectDto, String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "updateProject", null);
__decorate([
    (0, decorators_1.Post)('/:projectId/users'),
    (0, decorators_1.ProjectScope)('project:manageMembers'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AddUsersToProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "addProjectUsers", null);
__decorate([
    (0, decorators_1.Patch)('/:projectId/users/:userId'),
    (0, decorators_1.ProjectScope)('project:manageMembers'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('userId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.ChangeUserRoleInProject]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "changeProjectUserRole", null);
__decorate([
    (0, decorators_1.Delete)('/:projectId/users/:userId'),
    (0, decorators_1.ProjectScope)('project:manageMembers'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "deleteProjectUser", null);
__decorate([
    (0, decorators_1.Delete)('/:projectId'),
    (0, decorators_1.ProjectScope)('project:delete'),
    __param(2, decorators_1.Query),
    __param(3, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.DeleteProjectDto, String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "deleteProject", null);
exports.ProjectController = ProjectController = __decorate([
    (0, decorators_1.RestController)('/projects'),
    __metadata("design:paramtypes", [project_service_ee_1.ProjectService, provisioning_service_ee_1.ProvisioningService])
], ProjectController);
//# sourceMappingURL=project.controller.js.map