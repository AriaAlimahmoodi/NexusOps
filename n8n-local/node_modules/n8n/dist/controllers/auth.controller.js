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
exports.AuthController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const class_validator_1 = require("class-validator");
const auth_handler_registry_1 = require("../auth/auth-handler.registry");
const auth_service_1 = require("../auth/auth.service");
const constants_2 = require("../constants");
const errors_1 = require("@n8n/errors");
const license_1 = require("../license");
const mfa_service_1 = require("../mfa/mfa.service");
const posthog_1 = require("../posthog");
const user_service_1 = require("../services/user.service");
const sso_helpers_1 = require("../sso.ee/sso-helpers");
require("../auth/handlers/email.auth-handler");
let AuthController = class AuthController {
    constructor(logger, authService, mfaService, userService, license, userRepository, eventService, authHandlerRegistry, postHog) {
        this.logger = logger;
        this.authService = authService;
        this.mfaService = mfaService;
        this.userService = userService;
        this.license = license;
        this.userRepository = userRepository;
        this.eventService = eventService;
        this.authHandlerRegistry = authHandlerRegistry;
        this.postHog = postHog;
    }
    async login(req, res, payload) {
        const { emailOrLdapLoginId, password, mfaCode, mfaRecoveryCode } = payload;
        const currentAuthenticationMethod = (0, sso_helpers_1.getCurrentAuthenticationMethod)();
        this.validateEmailFormat(currentAuthenticationMethod, emailOrLdapLoginId);
        const emailHandler = this.authHandlerRegistry.get('email', 'password');
        if (!emailHandler) {
            this.logger.error('Email authentication handler is not registered');
            throw new errors_1.InternalServerError('Email authentication method not available');
        }
        const preliminaryUser = await emailHandler.handleLogin(emailOrLdapLoginId, password);
        this.validateSsoRestrictions(preliminaryUser, emailOrLdapLoginId);
        const { user, usedAuthenticationMethod } = await this.authenticateWithPassword(currentAuthenticationMethod, emailOrLdapLoginId, password, preliminaryUser);
        await this.validateMfa(user, mfaCode, mfaRecoveryCode);
        this.authService.issueCookie(res, user, user.mfaEnabled, req.browserId);
        this.eventService.emit('user-logged-in', {
            user,
            authenticationMethod: usedAuthenticationMethod,
        });
        return await this.userService.toPublic(user, {
            posthog: this.postHog,
            withScopes: true,
            mfaAuthenticated: user.mfaEnabled,
        });
    }
    validateEmailFormat(authMethod, emailOrLdapLoginId) {
        if (authMethod === 'email' && !(0, class_validator_1.isEmail)(emailOrLdapLoginId)) {
            throw new errors_1.BadRequestError('Invalid email address');
        }
    }
    validateSsoRestrictions(preliminaryUser, userEmail) {
        const shouldBlockSsoUser = ((0, sso_helpers_1.isSamlCurrentAuthenticationMethod)() || (0, sso_helpers_1.isOidcCurrentAuthenticationMethod)()) &&
            preliminaryUser?.role.slug !== db_1.GLOBAL_OWNER_ROLE.slug &&
            !preliminaryUser?.settings?.allowSSOManualLogin;
        if (shouldBlockSsoUser) {
            this.eventService.emit('user-login-failed', {
                authenticationMethod: 'email',
                userEmail,
                reason: 'SSO is enabled, please log in with SSO',
            });
            throw new errors_1.AuthError('SSO is enabled, please log in with SSO', api_types_1.SSO_LOGIN_REQUIRED_ERROR_CODE);
        }
    }
    async authenticateWithPassword(getCurrentAuthenticationMethod, emailOrLdapLoginId, password, preliminaryUser) {
        let user = preliminaryUser;
        let usedAuthenticationMethod = 'email';
        const shouldTryAlternativeAuth = getCurrentAuthenticationMethod !== 'email' &&
            preliminaryUser?.role.slug !== db_1.GLOBAL_OWNER_ROLE.slug;
        if (shouldTryAlternativeAuth) {
            const authHandler = this.authHandlerRegistry.get(getCurrentAuthenticationMethod, 'password');
            if (authHandler) {
                user = await authHandler.handleLogin(emailOrLdapLoginId, password);
                usedAuthenticationMethod = getCurrentAuthenticationMethod;
            }
        }
        if (!user) {
            this.eventService.emit('user-login-failed', {
                authenticationMethod: usedAuthenticationMethod,
                userEmail: emailOrLdapLoginId,
                reason: 'wrong credentials',
            });
            throw new errors_1.AuthError('Wrong username or password. Do you have caps lock on?');
        }
        return { user, usedAuthenticationMethod };
    }
    async validateMfa(user, mfaCode, mfaRecoveryCode) {
        if (!user.mfaEnabled) {
            return;
        }
        if (!mfaCode && !mfaRecoveryCode) {
            throw new errors_1.AuthError('MFA Error', 998);
        }
        const isMfaCodeOrMfaRecoveryCodeValid = await this.mfaService.validateMfa(user.id, mfaCode, mfaRecoveryCode);
        if (!isMfaCodeOrMfaRecoveryCodeValid) {
            throw new errors_1.AuthError('Invalid mfa token or recovery code');
        }
    }
    async currentUser(req) {
        const user = await this.userService.findUserWithAuthIdentities(req.user.id);
        return await this.userService.toPublic(user, {
            posthog: this.postHog,
            withScopes: true,
            mfaAuthenticated: req.authInfo?.usedMfa,
        });
    }
    async resolveSignupToken(_req, _res, payload) {
        if ((0, sso_helpers_1.isSsoCurrentAuthenticationMethod)()) {
            this.logger.debug('Invite links are not supported on this system, please use single sign on instead.');
            throw new errors_1.BadRequestError('Invite links are not supported on this system, please use single sign on instead.');
        }
        if (!payload.token) {
            this.logger.debug('Request to resolve signup token failed because token is missing');
            throw new errors_1.BadRequestError('Token is required');
        }
        const { inviterId, inviteeId } = await this.userService.getInvitationIdsFromPayload(payload.token);
        const isWithinUsersLimit = this.license.isWithinUsersLimit();
        if (!isWithinUsersLimit) {
            this.logger.debug('Request to resolve signup token failed because of users quota reached', {
                inviterId,
                inviteeId,
            });
            throw new errors_1.ForbiddenError(constants_2.RESPONSE_ERROR_MESSAGES.USERS_QUOTA_REACHED);
        }
        const users = await this.userRepository.findManyByIds([inviterId, inviteeId], {
            includeRole: true,
        });
        if (users.length !== 2) {
            this.logger.debug('Request to resolve signup token failed because the ID of the inviter and/or the ID of the invitee were not found in database', { inviterId, inviteeId });
            throw new errors_1.BadRequestError('Invalid invite URL');
        }
        const invitee = users.find((user) => user.id === inviteeId);
        if (!invitee || invitee.password) {
            this.logger.error('Invalid invite URL - invitee already setup', {
                inviterId,
                inviteeId,
            });
            throw new errors_1.BadRequestError('The invitation was likely either deleted or already claimed');
        }
        const inviter = users.find((user) => user.id === inviterId);
        if (!inviter?.email) {
            this.logger.error('Request to resolve signup token failed because inviter does not exist or is not set up', {
                inviterId: inviter?.id,
            });
            throw new errors_1.BadRequestError('Invalid request');
        }
        this.eventService.emit('user-invite-email-click', { inviter, invitee });
        const { firstName, lastName } = inviter;
        return { inviter: { firstName, lastName } };
    }
    async logout(req, res) {
        await this.authService.invalidateToken(req);
        this.authService.clearCookie(res);
        return { loggedOut: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Post)('/login', {
        skipAuth: true,
        ipRateLimit: {
            limit: 1000,
            windowMs: 5 * constants_1.Time.minutes.toMilliseconds,
        },
        keyedRateLimit: (0, decorators_1.createBodyKeyedRateLimiter)({
            limit: 5,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
            field: 'emailOrLdapLoginId',
        }),
    }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.LoginRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, decorators_1.Get)('/login', {
        allowSkipMFA: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "currentUser", null);
__decorate([
    (0, decorators_1.Get)('/resolve-signup-token', { skipAuth: true }),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ResolveSignupTokenQueryDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resolveSignupToken", null);
__decorate([
    (0, decorators_1.Post)('/logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, decorators_1.RestController)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, auth_service_1.AuthService, mfa_service_1.MfaService, user_service_1.UserService, license_1.License, db_1.UserRepository, backend_services_1.EventService, auth_handler_registry_1.AuthHandlerRegistry, posthog_1.PostHogClient])
], AuthController);
//# sourceMappingURL=auth.controller.js.map