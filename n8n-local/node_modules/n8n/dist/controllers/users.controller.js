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
exports.UsersController = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const auth_service_1 = require("../auth/auth.service");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const user_service_1 = require("../services/user.service");
let UsersController = class UsersController {
    constructor(userRepository, authService, userService, jwtService, urlService) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.userService = userService;
        this.jwtService = jwtService;
        this.urlService = urlService;
    }
    removeSupplementaryFields(publicUsers, listQueryOptions, currentUser) {
        const { select } = listQueryOptions;
        if (select !== undefined && !select.includes('id')) {
            for (const user of publicUsers)
                delete user.id;
        }
        if (select) {
            for (const user of publicUsers) {
                delete user.isOwner;
                delete user.isPending;
                delete user.signInType;
            }
        }
        const usersSeesAllDetails = (0, permissions_1.hasGlobalScope)(currentUser, 'user:create');
        return publicUsers.map((user) => {
            return usersSeesAllDetails || user.id === currentUser.id
                ? api_types_1.userDetailSchema.parse(user)
                : api_types_1.userBaseSchema.parse(user);
        });
    }
    async listUsers(req, _res, listQueryOptions) {
        await this.userService.assertGetUsersAccess(req.user, listQueryOptions.filter?.projectId);
        const userQuery = this.userRepository.buildUserQuery(listQueryOptions);
        const response = await userQuery.getManyAndCount();
        const [users, count] = response;
        const publicUsers = await Promise.all(users.map(async (u) => {
            const user = await this.userService.toPublic(u);
            if (listQueryOptions.select && !listQueryOptions.select?.includes('role')) {
                delete user.role;
            }
            return {
                ...user,
                projectRelations: u.projectRelations?.map((pr) => ({
                    id: pr.projectId,
                    role: pr.role.slug,
                    name: pr.project.name,
                    icon: pr.project.icon,
                })),
            };
        }));
        return api_types_1.usersListSchema.parse({
            count,
            items: this.removeSupplementaryFields(publicUsers, listQueryOptions, req.user),
        });
    }
    async getUserPasswordResetLink(req) {
        const user = await this.userRepository.findOneOrFail({
            where: { id: req.params.id },
            relations: ['role'],
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (req.user.role.slug === db_1.GLOBAL_ADMIN_ROLE.slug &&
            user.role.slug === db_1.GLOBAL_OWNER_ROLE.slug) {
            throw new errors_1.ForbiddenError('Admin cannot reset password of global owner');
        }
        const link = this.authService.generatePasswordResetUrl(user);
        return { link };
    }
    async generateInviteLink(req, _res) {
        const inviterId = req.user.id;
        const inviteeId = req.params.id;
        const targetUser = await this.userRepository.findOne({ where: { id: inviteeId } });
        if (!targetUser) {
            throw new errors_1.NotFoundError('User to generate invite link for not found');
        }
        const token = this.jwtService.sign('invite', {
            inviterId,
            inviteeId,
        }, {
            expiresIn: '90d',
        });
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const inviteLink = `${baseUrl}/signup?token=${token}`;
        return { link: inviteLink };
    }
    async updateUserSettings(_req, _res, payload, id) {
        await this.userService.updateSettings(id, payload);
        const user = await this.userRepository.findOneOrFail({
            select: ['settings'],
            where: { id },
        });
        return user.settings;
    }
    async deleteUser(req) {
        return await this.userService.deleteUser(req.user, req.params.id, req.query.transferId);
    }
    async changeGlobalRole(req, _, payload, id) {
        return await this.userService.changeGlobalRole(req.user, id, payload);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('user:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UsersListFilterDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listUsers", null);
__decorate([
    (0, decorators_1.Get)('/:id/password-reset-link'),
    (0, decorators_1.GlobalScope)('user:resetPassword'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserPasswordResetLink", null);
__decorate([
    (0, decorators_1.Post)('/:id/invite-link'),
    (0, decorators_1.GlobalScope)('user:generateInviteLink'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "generateInviteLink", null);
__decorate([
    (0, decorators_1.Patch)('/:id/settings'),
    (0, decorators_1.GlobalScope)('user:update'),
    __param(2, decorators_1.Body),
    __param(3, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SettingsUpdateRequestDto, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserSettings", null);
__decorate([
    (0, decorators_1.Delete)('/:id'),
    (0, decorators_1.GlobalScope)('user:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, decorators_1.Patch)('/:id/role'),
    (0, decorators_1.GlobalScope)('user:changeRole'),
    (0, decorators_1.Licensed)('feat:advancedPermissions'),
    __param(2, decorators_1.Body),
    __param(3, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.RoleChangeRequestDto, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changeGlobalRole", null);
exports.UsersController = UsersController = __decorate([
    (0, decorators_1.RestController)('/users'),
    __metadata("design:paramtypes", [db_1.UserRepository, auth_service_1.AuthService, user_service_1.UserService, backend_services_1.JwtService, backend_services_1.UrlService])
], UsersController);
//# sourceMappingURL=users.controller.js.map