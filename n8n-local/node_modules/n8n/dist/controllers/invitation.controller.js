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
exports.InvitationController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const auth_service_1 = require("../auth/auth.service");
const errors_1 = require("@n8n/errors");
const external_hooks_1 = require("../external-hooks");
const posthog_1 = require("../posthog");
const password_utility_1 = require("../services/password.utility");
const user_service_1 = require("../services/user.service");
const sso_helpers_1 = require("../sso.ee/sso-helpers");
let InvitationController = class InvitationController {
    constructor(logger, externalHooks, authService, userService, passwordUtility, userRepository, postHog, eventService) {
        this.logger = logger;
        this.externalHooks = externalHooks;
        this.authService = authService;
        this.userService = userService;
        this.passwordUtility = passwordUtility;
        this.userRepository = userRepository;
        this.postHog = postHog;
        this.eventService = eventService;
    }
    async inviteUser(req, _res, invitations) {
        return await this.userService.inviteUser(req.user, invitations);
    }
    async processInvitationAcceptance(inviterId, inviteeId, firstName, lastName, password, req, res) {
        const users = await this.userRepository.find({
            where: [{ id: inviterId }, { id: inviteeId }],
            relations: ['role'],
        });
        if (users.length !== 2) {
            this.logger.debug('Request to fill out a user shell failed because the inviter ID and/or invitee ID were not found in database', {
                inviterId,
                inviteeId,
            });
            throw new errors_1.BadRequestError('Invalid payload or URL');
        }
        const invitee = users.find((user) => user.id === inviteeId);
        if (invitee.password) {
            this.logger.debug('Request to fill out a user shell failed because the invite had already been accepted', { inviteeId });
            throw new errors_1.BadRequestError('This invite has been accepted already');
        }
        invitee.firstName = firstName;
        invitee.lastName = lastName;
        invitee.password = await this.passwordUtility.hash(password);
        const updatedUser = await this.userRepository.save(invitee, { transaction: false });
        this.authService.issueCookie(res, updatedUser, false, req.browserId);
        this.eventService.emit('user-signed-up', {
            user: updatedUser,
            userType: 'email',
            wasDisabledLdapUser: false,
        });
        const publicInvitee = await this.userService.toPublic(invitee);
        await this.externalHooks.run('user.profile.update', [invitee.email, publicInvitee]);
        await this.externalHooks.run('user.password.update', [invitee.email, invitee.password]);
        return await this.userService.toPublic(updatedUser, {
            posthog: this.postHog,
            withScopes: true,
        });
    }
    async acceptInvitationWithToken(req, res, payload) {
        if ((0, sso_helpers_1.isSsoCurrentAuthenticationMethod)()) {
            this.logger.debug('Invite links are not supported on this system, please use single sign on instead.');
            throw new errors_1.BadRequestError('Invite links are not supported on this system, please use single sign on instead.');
        }
        if (!payload.token) {
            this.logger.debug('Request to accept invitation failed because token is missing');
            throw new errors_1.BadRequestError('Token is required');
        }
        const { firstName, lastName, password } = payload;
        const { inviterId, inviteeId } = await this.userService.getInvitationIdsFromPayload(payload.token);
        return await this.processInvitationAcceptance(inviterId, inviteeId, firstName, lastName, password, req, res);
    }
};
exports.InvitationController = InvitationController;
__decorate([
    (0, decorators_1.Post)('/', { ipRateLimit: { limit: 10 } }),
    (0, decorators_1.GlobalScope)('user:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InviteUsersRequestDto]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "inviteUser", null);
__decorate([
    (0, decorators_1.Post)('/accept', {
        skipAuth: true,
        ipRateLimit: { limit: 100, windowMs: 1 * constants_1.Time.minutes.toMilliseconds },
    }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AcceptInvitationRequestDto]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "acceptInvitationWithToken", null);
exports.InvitationController = InvitationController = __decorate([
    (0, decorators_1.RestController)('/invitations'),
    __metadata("design:paramtypes", [backend_common_1.Logger, external_hooks_1.ExternalHooks, auth_service_1.AuthService, user_service_1.UserService, password_utility_1.PasswordUtility, db_1.UserRepository, posthog_1.PostHogClient, backend_services_1.EventService])
], InvitationController);
//# sourceMappingURL=invitation.controller.js.map