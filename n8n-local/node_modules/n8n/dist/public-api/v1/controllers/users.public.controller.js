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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const pick_1 = __importDefault(require("lodash/pick"));
const errors_1 = require("@n8n/errors");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const project_service_ee_1 = require("../../../services/project.service.ee");
const user_service_1 = require("../../../services/user.service");
const tags = ['User'];
const userProperties = ['id', 'email', 'firstName', 'lastName', 'isPending', 'mfaEnabled'];
function toPublicApiUser(user, options) {
    const publicApiUser = {
        ...(0, pick_1.default)(user, ...userProperties),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
    return options?.includeRole ? { ...publicApiUser, role: user.role?.slug } : publicApiUser;
}
let UsersPublicController = class UsersPublicController {
    constructor(userService, projectService, eventService) {
        this.userService = userService;
        this.projectService = projectService;
        this.eventService = eventService;
    }
    async getUsers(req, _res, query) {
        const { includeRole, projectId } = query;
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        await this.userService.assertGetUsersAccess(req.user, projectId);
        const userIdsInProject = projectId
            ? await this.projectService.findUserIdsByProjectId(projectId)
            : undefined;
        const { users, count } = await this.userService.getUsersAndCount({
            ids: userIdsInProject,
            limit,
            offset,
        });
        this.eventService.emit('user-retrieved-all-users', {
            userId: req.user.id,
            publicApi: true,
        });
        return {
            data: users.map((user) => toPublicApiUser(user, { includeRole })),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async getUser(req, _res, userId, query) {
        const { includeRole } = query;
        const user = await this.userService.getUser(userId);
        if (!user) {
            throw new errors_1.NotFoundError(`Could not find user with id: ${userId}`);
        }
        this.eventService.emit('user-retrieved-user', {
            userId: req.user.id,
            publicApi: true,
        });
        return toPublicApiUser(user, { includeRole });
    }
    async createUser(req, _res, body) {
        return await this.userService.inviteUser(req.user, body);
    }
    async deleteUser(req, _res, userId, query) {
        await this.userService.deleteUser(req.user, userId, query.transferId);
    }
    async changeRole(req, _res, userId, body) {
        await this.userService.changeGlobalRole(req.user, userId, body);
    }
};
exports.UsersPublicController = UsersPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('user:list'),
    (0, decorators_1.RequiresUserQuota)(),
    (0, decorators_1.ApiSummary)('Retrieve all users'),
    (0, decorators_1.ApiDescription)('Retrieve all users from your instance. Only available for the instance owner.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.UserListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404, { description: 'The given `projectId` does not exist.' }),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListUsersQueryDto]),
    __metadata("design:returntype", Promise)
], UsersPublicController.prototype, "getUsers", null);
__decorate([
    (0, decorators_1.Get)('/:userId'),
    (0, decorators_1.ApiKeyScope)('user:read'),
    (0, decorators_1.RequiresUserQuota)(),
    (0, decorators_1.ApiSummary)('Get user by ID/Email'),
    (0, decorators_1.ApiDescription)('Retrieve a user from your instance. Only available for the instance owner.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.UserPublicDto),
    (0, decorators_1.ApiErrorResponse)(404, { description: 'No user with that ID or email.' }),
    __param(2, (0, decorators_1.Param)('userId', api_types_1.userIdentifierParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.GetUserQueryDto]),
    __metadata("design:returntype", Promise)
], UsersPublicController.prototype, "getUser", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('user:create'),
    (0, decorators_1.ApiSummary)('Create multiple users'),
    (0, decorators_1.ApiDescription)('Create one or more users.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.InvitedUsersPublicDto),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateUsersPublicDto]),
    __metadata("design:returntype", Promise)
], UsersPublicController.prototype, "createUser", null);
__decorate([
    (0, decorators_1.Delete)('/:userId'),
    (0, decorators_1.ApiKeyScope)('user:delete'),
    (0, decorators_1.ApiSummary)('Delete user'),
    (0, decorators_1.ApiDescription)('Delete a user from your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('userId', api_types_1.userUuidParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.DeleteUserQueryPublicDto]),
    __metadata("design:returntype", Promise)
], UsersPublicController.prototype, "deleteUser", null);
__decorate([
    (0, decorators_1.Patch)('/:userId/role'),
    (0, decorators_1.Licensed)('feat:advancedPermissions'),
    (0, decorators_1.ApiKeyScope)('user:changeRole'),
    (0, decorators_1.ApiSummary)("Change a user's global role"),
    (0, decorators_1.ApiDescription)("Change a user's global role"),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('userId', api_types_1.userUuidParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.RoleChangeRequestDto]),
    __metadata("design:returntype", Promise)
], UsersPublicController.prototype, "changeRole", null);
exports.UsersPublicController = UsersPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/users'),
    __metadata("design:paramtypes", [user_service_1.UserService, project_service_ee_1.ProjectService, backend_services_1.EventService])
], UsersPublicController);
//# sourceMappingURL=users.public.controller.js.map