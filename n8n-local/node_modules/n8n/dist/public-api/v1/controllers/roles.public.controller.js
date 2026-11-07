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
exports.RolesPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const role_authorization_1 = require("../../../services/role-authorization");
const isPublicRole = (role) => role.roleType === 'global' || role.roleType === 'project';
const toRolePublicDto = (role) => ({
    slug: role.slug,
    displayName: role.displayName,
    description: role.description,
    systemRole: role.systemRole,
    roleType: role.roleType,
    scopes: role.scopes,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
});
const toRoleGetPublicDto = (role, withUsageCount) => ({
    ...toRolePublicDto(role),
    licensed: role.licensed,
    ...(withUsageCount ? { usedByUsers: role.usedByUsers, usedByProjects: role.usedByProjects } : {}),
});
let RolesPublicController = class RolesPublicController {
    constructor(roleService, eventService) {
        this.roleService = roleService;
        this.eventService = eventService;
    }
    async getAllRoles(_req, _res, query) {
        const { withUsageCount } = query;
        const allRoles = await this.roleService.getAllRoles(withUsageCount);
        const publicRoles = allRoles.filter(isPublicRole);
        const groupOf = (roleType) => publicRoles
            .filter((role) => role.roleType === roleType)
            .map((role) => ({
            ...toRoleGetPublicDto({ ...role, roleType }, withUsageCount),
            roleType,
        }));
        return {
            global: groupOf('global'),
            project: groupOf('project'),
        };
    }
    async getRole(_req, _res, roleSlug, query) {
        const { withUsageCount } = query;
        const role = await this.roleService.getRole(roleSlug, withUsageCount);
        if (!isPublicRole(role)) {
            throw new errors_1.NotFoundError('Role not found');
        }
        return toRoleGetPublicDto({ ...role, roleType: role.roleType }, withUsageCount);
    }
    async createRole(req, _res, createRole) {
        (0, role_authorization_1.assertCanManageRoleType)({
            apiKeyScopes: req.tokenGrant?.apiKeyScopes ?? [],
            roleType: createRole.roleType,
            user: req.user,
        });
        const role = await this.roleService.createCustomRole(createRole);
        this.eventService.emit('custom-role-created', {
            userId: req.user.id,
            roleSlug: role.slug,
            scopes: role.scopes,
            source: 'public-api',
        });
        return toRolePublicDto({ ...role, roleType: createRole.roleType });
    }
    async updateRole(req, _res, roleSlug, updateRole) {
        const role = await this.roleService.getRole(roleSlug);
        if (!isPublicRole(role)) {
            throw new errors_1.NotFoundError('Role not found');
        }
        (0, role_authorization_1.assertCanManageRoleType)({
            apiKeyScopes: req.tokenGrant?.apiKeyScopes ?? [],
            roleType: role.roleType,
            user: req.user,
        });
        const result = await this.roleService.updateCustomRole({
            slug: roleSlug,
            newRole: updateRole,
            userId: req.user.id,
        });
        return toRolePublicDto({ ...result, roleType: role.roleType });
    }
    async deleteRole(req, _res, roleSlug, query) {
        const role = await this.roleService.getRole(roleSlug);
        if (!isPublicRole(role)) {
            throw new errors_1.NotFoundError('Role not found');
        }
        const apiKeyScopes = req.tokenGrant?.apiKeyScopes ?? [];
        (0, role_authorization_1.assertCanManageRoleType)({
            apiKeyScopes,
            roleType: role.roleType,
            user: req.user,
        });
        const reassignRoleSlug = (0, role_authorization_1.canReassignUsers)({ apiKeyScopes, role, user: req.user })
            ? query.reassignRoleSlug
            : undefined;
        const result = await this.roleService.removeCustomRole({
            slug: roleSlug,
            reassignRoleSlug,
            userId: req.user.id,
        });
        return toRolePublicDto({ ...result, roleType: role.roleType });
    }
};
exports.RolesPublicController = RolesPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('role:list'),
    (0, decorators_1.ApiSummary)('Retrieve all roles'),
    (0, decorators_1.ApiDescription)('Returns all roles grouped by type (global and project). Set `withUsageCount` to include how many users and projects use each role.'),
    (0, decorators_1.ApiTags)(['Role']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RoleListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.RoleListQueryPublicDto]),
    __metadata("design:returntype", Promise)
], RolesPublicController.prototype, "getAllRoles", null);
__decorate([
    (0, decorators_1.Get)('/:roleSlug'),
    (0, decorators_1.ApiKeyScope)('role:read'),
    (0, decorators_1.ApiSummary)('Retrieve a role'),
    (0, decorators_1.ApiDescription)('Returns a single role with its scopes. Set `withUsageCount` to include how many users and projects use the role.'),
    (0, decorators_1.ApiTags)(['Role']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RoleGetPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('roleSlug', api_types_1.roleSlugParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.RoleListQueryPublicDto]),
    __metadata("design:returntype", Promise)
], RolesPublicController.prototype, "getRole", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)({ anyOf: ['role:manage', 'role:manageProject'] }),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.CUSTOM_ROLES),
    (0, decorators_1.ApiSummary)('Create a custom role'),
    (0, decorators_1.ApiDescription)('Creates a custom role. Set `roleType` to `global` for an instance-wide role or `project` for a project role.'),
    (0, decorators_1.ApiTags)(['Role']),
    (0, decorators_1.ApiResponse)(201, api_types_1.RolePublicDto),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesPublicController.prototype, "createRole", null);
__decorate([
    (0, decorators_1.Put)('/:roleSlug'),
    (0, decorators_1.ApiKeyScope)({ anyOf: ['role:manage', 'role:manageProject'] }),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.CUSTOM_ROLES),
    (0, decorators_1.ApiSummary)('Update a custom role'),
    (0, decorators_1.ApiDescription)("Replaces a custom role's display name, description, and scopes. System roles cannot be updated."),
    (0, decorators_1.ApiTags)(['Role']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RolePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('roleSlug', api_types_1.roleSlugParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateRolePublicDto]),
    __metadata("design:returntype", Promise)
], RolesPublicController.prototype, "updateRole", null);
__decorate([
    (0, decorators_1.Delete)('/:roleSlug'),
    (0, decorators_1.ApiKeyScope)({ anyOf: ['role:manage', 'role:manageProject'] }),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.CUSTOM_ROLES),
    (0, decorators_1.ApiSummary)('Delete a custom role'),
    (0, decorators_1.ApiDescription)('Deletes a custom role. System roles cannot be deleted. A role with users assigned cannot be deleted unless `reassignRoleSlug` is set to move those users to another role first.'),
    (0, decorators_1.ApiTags)(['Role']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RolePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('roleSlug', api_types_1.roleSlugParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.RoleDeleteQueryDto]),
    __metadata("design:returntype", Promise)
], RolesPublicController.prototype, "deleteRole", null);
exports.RolesPublicController = RolesPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/roles'),
    __metadata("design:paramtypes", [backend_services_1.RoleService, backend_services_1.EventService])
], RolesPublicController);
//# sourceMappingURL=roles.public.controller.js.map