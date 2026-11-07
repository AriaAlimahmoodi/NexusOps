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
exports.MeController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const class_transformer_1 = require("class-transformer");
const auth_service_1 = require("../auth/auth.service");
const errors_1 = require("@n8n/errors");
const invalid_mfa_code_error_1 = require("../errors/response-errors/invalid-mfa-code.error");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
const mfa_service_1 = require("../mfa/mfa.service");
const password_utility_1 = require("../services/password.utility");
const user_service_1 = require("../services/user.service");
const sso_helpers_1 = require("../sso.ee/sso-helpers");
const survey_answers_dto_1 = require("./survey-answers.dto");
let MeController = class MeController {
    constructor(logger, externalHooks, authService, userService, passwordUtility, userRepository, eventService, mfaService, globalConfig) {
        this.logger = logger;
        this.externalHooks = externalHooks;
        this.authService = authService;
        this.userService = userService;
        this.passwordUtility = passwordUtility;
        this.userRepository = userRepository;
        this.eventService = eventService;
        this.mfaService = mfaService;
        this.globalConfig = globalConfig;
    }
    async updateCurrentUser(req, _, payload) {
        const { id: userId, email: currentEmail, firstName: currentFirstName, lastName: currentLastName, } = req.user;
        if (this.isUserManagedByEnv(req.user)) {
            throw new errors_1.ForbiddenError('This account is managed via environment variables and cannot be modified through the API');
        }
        const { firstName, lastName } = payload;
        const isFirstNameChanged = firstName !== currentFirstName;
        const isLastNameChanged = lastName !== currentLastName;
        if (isFirstNameChanged || isLastNameChanged) {
            const ssoIdentity = await this.userService.findSsoIdentity(userId);
            if (ssoIdentity && this.isAuthIdentityActive(ssoIdentity)) {
                this.logger.debug(`Request to update user failed because ${ssoIdentity.providerType} user may not change their profile information`, {
                    userId,
                    payload,
                });
                throw new errors_1.BadRequestError(`${ssoIdentity.providerType.toUpperCase()} user may not change their profile information`);
            }
        }
        await this.externalHooks.run('user.profile.beforeUpdate', [userId, currentEmail, payload]);
        const preUpdateUser = await this.userRepository.findOneByOrFail({ id: userId });
        await this.userService.update(userId, payload);
        const user = await this.userService.findUserWithAuthIdentities(userId);
        this.logger.info('User updated successfully', { userId });
        const changeableFields = ['firstName', 'lastName'];
        const fieldsChanged = changeableFields.filter((key) => key in payload && payload[key] !== preUpdateUser[key]);
        this.eventService.emit('user-updated', { user, fieldsChanged });
        const publicUser = await this.userService.toPublic(user);
        await this.externalHooks.run('user.profile.update', [currentEmail, publicUser]);
        return publicUser;
    }
    isUserManagedByEnv(user) {
        const { instanceSettingsLoader } = this.globalConfig;
        return (instanceSettingsLoader.ownerManagedByEnv &&
            !!user.email &&
            user.email.toLowerCase() === instanceSettingsLoader.ownerEmail.toLowerCase());
    }
    isAuthIdentityActive(authIdentity) {
        return authIdentity.providerType === (0, sso_helpers_1.getCurrentAuthenticationMethod)();
    }
    async updatePassword(req, res, payload) {
        const { user } = req;
        const { currentPassword, newPassword, mfaCode } = payload;
        if (this.isUserManagedByEnv(user)) {
            throw new errors_1.ForbiddenError('This account is managed via environment variables and cannot be modified through the API');
        }
        if ((0, sso_helpers_1.isSamlLicensedAndEnabled)()) {
            this.logger.debug('Attempted to change password for user, while SAML is enabled', {
                userId: user.id,
            });
            throw new errors_1.BadRequestError('With SAML enabled, users need to use their SAML provider to change passwords');
        }
        if (!user.password) {
            throw new errors_1.BadRequestError('Requesting user not set up.');
        }
        const isCurrentPwCorrect = await this.passwordUtility.compare(currentPassword, user.password);
        if (!isCurrentPwCorrect) {
            throw new errors_1.BadRequestError('Provided current password is incorrect.');
        }
        const passwordValidation = (0, api_types_1.createPasswordSchema)(this.globalConfig.userManagement.password.minLength).safeParse(newPassword);
        if (!passwordValidation.success) {
            throw new errors_1.BadRequestError(passwordValidation.error.errors.map(({ message }) => message).join(' '));
        }
        if (user.mfaEnabled) {
            if (typeof mfaCode !== 'string') {
                throw new errors_1.BadRequestError('Two-factor code is required to change password.');
            }
            const isMfaCodeValid = await this.mfaService.validateMfa(user.id, mfaCode, undefined);
            if (!isMfaCodeValid) {
                throw new invalid_mfa_code_error_1.InvalidMfaCodeError();
            }
        }
        user.password = await this.passwordUtility.hash(newPassword);
        const updatedUser = await this.userRepository.save(user, { transaction: false });
        this.logger.info('Password updated successfully', { userId: user.id });
        this.authService.issueCookie(res, updatedUser, req.authInfo?.usedMfa ?? false, req.browserId);
        this.eventService.emit('user-updated', { user: updatedUser, fieldsChanged: ['password'] });
        await this.externalHooks.run('user.password.update', [updatedUser.email, updatedUser.password]);
        return { success: true };
    }
    async storeSurveyAnswers(req) {
        const { body: personalizationAnswers } = req;
        if (!personalizationAnswers) {
            this.logger.debug('Request to store user personalization survey failed because of undefined payload', {
                userId: req.user.id,
            });
            throw new errors_1.BadRequestError('Personalization answers are mandatory');
        }
        const validatedAnswers = (0, class_transformer_1.plainToInstance)(survey_answers_dto_1.PersonalizationSurveyAnswersV4, personalizationAnswers, { excludeExtraneousValues: true });
        await (0, generic_helpers_1.validateEntity)(validatedAnswers);
        await this.userRepository.save({
            id: req.user.id,
            personalizationAnswers: validatedAnswers,
        }, { transaction: false });
        this.logger.info('User survey updated successfully', { userId: req.user.id });
        this.eventService.emit('user-submitted-personalization-survey', {
            userId: req.user.id,
            answers: validatedAnswers,
        });
        return { success: true };
    }
    async updateCurrentUserSettings(req, _, payload) {
        const { id } = req.user;
        await this.userService.updateSettings(id, payload);
        const user = await this.userRepository.findOneOrFail({
            select: ['settings'],
            where: { id },
        });
        return user.settings;
    }
};
exports.MeController = MeController;
__decorate([
    (0, decorators_1.Patch)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UserUpdateRequestDto]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "updateCurrentUser", null);
__decorate([
    (0, decorators_1.Patch)('/password', {
        keyedRateLimit: (0, decorators_1.createUserKeyedRateLimiter)({}),
    }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PasswordUpdateRequestDto]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "updatePassword", null);
__decorate([
    (0, decorators_1.Post)('/survey'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "storeSurveyAnswers", null);
__decorate([
    (0, decorators_1.Patch)('/settings'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UserSelfSettingsUpdateRequestDto]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "updateCurrentUserSettings", null);
exports.MeController = MeController = __decorate([
    (0, decorators_1.RestController)('/me'),
    __metadata("design:paramtypes", [backend_common_1.Logger, external_hooks_1.ExternalHooks, auth_service_1.AuthService, user_service_1.UserService, password_utility_1.PasswordUtility, db_1.UserRepository, backend_services_1.EventService, mfa_service_1.MfaService, config_1.GlobalConfig])
], MeController);
//# sourceMappingURL=me.controller.js.map