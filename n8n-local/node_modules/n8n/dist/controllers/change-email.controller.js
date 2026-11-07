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
exports.ChangeEmailController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const auth_service_1 = require("../auth/auth.service");
const errors_1 = require("@n8n/errors");
const external_hooks_1 = require("../external-hooks");
const email_change_service_1 = require("../services/email-change.service");
const user_service_1 = require("../services/user.service");
const email_1 = require("../user-management/email");
let ChangeEmailController = class ChangeEmailController {
    constructor(logger, externalHooks, authService, userService, userRepository, mailer, emailChangeService, eventService) {
        this.logger = logger;
        this.externalHooks = externalHooks;
        this.authService = authService;
        this.userService = userService;
        this.userRepository = userRepository;
        this.mailer = mailer;
        this.emailChangeService = emailChangeService;
        this.eventService = eventService;
    }
    async requestEmailChange(req, res, payload) {
        const { user } = req;
        const currentEmail = user.email;
        const newEmail = payload.email;
        if (newEmail === currentEmail) {
            throw new errors_1.BadRequestError('The new email address matches the current one');
        }
        await this.emailChangeService.assertMayRequestEmailChange(user, {
            currentPassword: payload.currentPassword,
            mfaCode: payload.mfaCode,
        });
        await this.assertEmailAvailable(newEmail);
        if (!this.mailer.isEmailSetUp) {
            const publicUser = await this.applyEmailChange(user.id, currentEmail, newEmail);
            this.authService.issueCookie(res, await this.userService.findUserWithAuthIdentities(user.id), req.authInfo?.usedMfa ?? false, req.browserId);
            return { status: 'changed', user: publicUser };
        }
        const confirmationUrl = this.authService.generateEmailChangeUrl(user, newEmail);
        try {
            await this.mailer.emailChangeConfirmation({
                email: currentEmail,
                firstName: user.firstName,
                newEmail,
                confirmationUrl,
            });
        }
        catch (error) {
            this.eventService.emit('email-failed', {
                user,
                messageType: 'Email change confirmation',
                publicApi: false,
            });
            if (error instanceof Error) {
                throw new errors_1.InternalServerError(`Please contact your administrator: ${error.message}`, error);
            }
            throw error;
        }
        this.logger.info('Sent email change confirmation successfully', { userId: user.id });
        this.eventService.emit('user-transactional-email-sent', {
            userId: user.id,
            messageType: 'Email change confirmation',
            publicApi: false,
        });
        return { status: 'confirmation-sent' };
    }
    async resolveChangeEmailToken(_req, _res, payload) {
        const resolved = await this.authService.resolveEmailChangeToken(payload.token);
        if (!resolved)
            throw new errors_1.NotFoundError('');
        return { email: resolved.newEmail };
    }
    async confirmEmailChange(_req, _res, payload) {
        const resolved = await this.authService.resolveEmailChangeToken(payload.token);
        if (!resolved)
            throw new errors_1.NotFoundError('');
        const { user, newEmail } = resolved;
        const oldEmail = user.email;
        await this.emailChangeService.assertMayApplyEmailChange(user);
        await this.assertEmailAvailable(newEmail);
        await this.applyEmailChange(user.id, oldEmail, newEmail);
        await this.mailer.emailChangeCompleted({
            email: oldEmail,
            firstName: user.firstName,
            newEmail,
        });
        this.logger.info('Email change confirmed successfully', { userId: user.id });
        return { success: true };
    }
    async assertEmailAvailable(email) {
        const existing = await this.userRepository.findOneBy({ email });
        if (existing) {
            throw new errors_1.BadRequestError('This email address is already in use');
        }
    }
    async applyEmailChange(userId, oldEmail, newEmail) {
        const current = await this.userRepository.findOneBy({ id: userId });
        if (!current || current.email !== oldEmail)
            throw new errors_1.NotFoundError('');
        await this.externalHooks.run('user.profile.beforeUpdate', [
            userId,
            oldEmail,
            { email: newEmail },
        ]);
        const result = await this.userRepository.changeEmail(userId, oldEmail, newEmail);
        if (result === 'stale')
            throw new errors_1.NotFoundError('');
        if (result === 'email-taken') {
            throw new errors_1.BadRequestError('This email address is already in use');
        }
        const user = await this.userService.findUserWithAuthIdentities(userId);
        this.eventService.emit('user-updated', { user, fieldsChanged: ['email'] });
        const publicUser = await this.userService.toPublic(user);
        await this.externalHooks.run('user.profile.update', [oldEmail, publicUser]);
        return publicUser;
    }
};
exports.ChangeEmailController = ChangeEmailController;
__decorate([
    (0, decorators_1.Post)('/change-email', {
        keyedRateLimit: (0, decorators_1.createUserKeyedRateLimiter)({}),
    }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ChangeEmailRequestDto]),
    __metadata("design:returntype", Promise)
], ChangeEmailController.prototype, "requestEmailChange", null);
__decorate([
    (0, decorators_1.Get)('/resolve-change-email-token', { skipAuth: true, ipRateLimit: true }),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ResolveChangeEmailTokenQueryDto]),
    __metadata("design:returntype", Promise)
], ChangeEmailController.prototype, "resolveChangeEmailToken", null);
__decorate([
    (0, decorators_1.Post)('/confirm-email-change', { skipAuth: true, ipRateLimit: true }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ConfirmEmailChangeRequestDto]),
    __metadata("design:returntype", Promise)
], ChangeEmailController.prototype, "confirmEmailChange", null);
exports.ChangeEmailController = ChangeEmailController = __decorate([
    (0, decorators_1.RestController)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, external_hooks_1.ExternalHooks, auth_service_1.AuthService, user_service_1.UserService, db_1.UserRepository, email_1.UserManagementMailer, email_change_service_1.EmailChangeService, backend_services_1.EventService])
], ChangeEmailController);
//# sourceMappingURL=change-email.controller.js.map