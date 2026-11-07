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
exports.RoleController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const project_service_ee_1 = require("../services/project.service.ee");
const role_authorization_1 = require("../services/role-authorization");
let RoleController = class RoleController {
    constructor(roleService, eventService, projectService) {
        this.roleService = roleService;
        this.eventService = eventService;
        this.projectService = projectService;
    }
    async getAllRoles(_req, _res, query) {
        const allRoles = await this.roleService.getAllRoles(query.withUsageCount);
        return {
            global: allRoles.filter((r) => r.roleType === 'global'),
            project: allRoles.filter((r) => r.roleType === 'project'),
            credential: allRoles.filter((r) => r.roleType === 'credential'),
            workflow: allRoles.filter((r) => r.roleType === 'workflow'),
        };
    }
    async getRoleProjectMembers(req, _res, slug, projectId) {
        const role = await this.roleService.getRole(slug);
        (0, role_authorization_1.assertCanManageRoleType)({
            roleType: role.roleType,
            user: req.user,
        });
        const project = await this.projectService.getProjectWithScope(req.user, projectId, [
            'project:list',
        ]);
        if (!project) {
            throw new errors_1.NotFoundError('Project not found');
        }
        const result = await this.roleService.getRoleProjectMembers(slug, projectId);
        return api_types_1.RoleProjectMembersResponseDto.parse(result);
    }
    async getRoleAssignments(req, _res, slug) {
        const role = await this.roleService.getRole(slug);
        (0, role_authorization_1.assertCanManageRoleType)({
            roleType: role.roleType,
            user: req.user,
        });
        const result = await this.roleService.getRoleAssignments(slug);
        if (result.projects.length === 0) {
            return api_types_1.RoleAssignmentsResponseDto.parse(result);
        }
        const visibleProjectIds = new Set(await this.projectService.getProjectIdsWithScope(req.user, ['project:list'], result.projects.map((project) => project.projectId)));
        return api_types_1.RoleAssignmentsResponseDto.parse({
            ...result,
            projects: result.projects.filter((project) => visibleProjectIds.has(project.projectId)),
        });
    }
    async getRoleMembers(_req, _res, slug) {
        const result = await this.roleService.getRoleMembers(slug);
        return api_types_1.RoleMembersResponseDto.parse(result);
    }
    async getRoleBySlug(_req, _res, slug, query) {
        return await this.roleService.getRole(slug, query.withUsageCount);
    }
    async updateRole(req, _res, slug, updateRole) {
        const role = await this.roleService.getRole(slug);
        (0, role_authorization_1.assertCanManageRoleType)({
            roleType: role.roleType,
            user: req.user,
        });
        return await this.roleService.updateCustomRole({
            slug,
            newRole: updateRole,
            userId: req.user.id,
        });
    }
    async deleteRole(req, _res, slug, query) {
        const role = await this.roleService.getRole(slug);
        (0, role_authorization_1.assertCanManageRoleType)({
            roleType: role.roleType,
            user: req.user,
        });
        const reassignRoleSlug = (0, role_authorization_1.canReassignUsers)({ role, user: req.user })
            ? query.reassignRoleSlug
            : undefined;
        return await this.roleService.removeCustomRole({
            slug,
            reassignRoleSlug,
            userId: req.user.id,
        });
    }
    async createRole(req, _res, createRole) {
        (0, role_authorization_1.assertCanManageRoleType)({
            roleType: createRole.roleType,
            user: req.user,
        });
        const result = await this.roleService.createCustomRole(createRole);
        this.eventService.emit('custom-role-created', {
            userId: req.user.id,
            roleSlug: result.slug,
            scopes: result.scopes,
            source: 'ui',
        });
        return result;
    }
};
exports.RoleController = RoleController;
__decorate([
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.RoleListQueryDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getAllRoles", null);
__decorate([
    (0, decorators_1.Get)('/:slug/assignments/:projectId/members'),
    __param(2, (0, decorators_1.Param)('slug')),
    __param(3, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String, String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getRoleProjectMembers", null);
__decorate([
    (0, decorators_1.Get)('/:slug/assignments'),
    __param(2, (0, decorators_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getRoleAssignments", null);
__decorate([
    (0, decorators_1.Get)('/:slug/members'),
    (0, decorators_1.GlobalScope)('role:read'),
    __param(2, (0, decorators_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getRoleMembers", null);
__decorate([
    (0, decorators_1.Get)('/:slug'),
    __param(2, (0, decorators_1.Param)('slug')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String, api_types_1.RoleGetQueryDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getRoleBySlug", null);
__decorate([
    (0, decorators_1.Patch)('/:slug'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.CUSTOM_ROLES),
    __param(2, (0, decorators_1.Param)('slug')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String, api_types_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "updateRole", null);
__decorate([
    (0, decorators_1.Delete)('/:slug'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.CUSTOM_ROLES),
    __param(2, (0, decorators_1.Param)('slug')),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String, api_types_1.RoleDeleteQueryDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "deleteRole", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.CUSTOM_ROLES),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "createRole", null);
exports.RoleController = RoleController = __decorate([
    (0, decorators_1.RestController)('/roles'),
    __metadata("design:paramtypes", [backend_services_1.RoleService, backend_services_1.EventService, project_service_ee_1.ProjectService])
], RoleController);
//# sourceMappingURL=role.controller.js.map