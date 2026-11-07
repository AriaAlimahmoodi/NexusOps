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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailChangeService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const invalid_mfa_code_error_1 = require("../errors/response-errors/invalid-mfa-code.error");
const mfa_service_1 = require("../mfa/mfa.service");
const password_utility_1 = require("../services/password.utility");
const user_service_1 = require("../services/user.service");
const sso_helpers_1 = require("../sso.ee/sso-helpers");
let EmailChangeService = class EmailChangeService {
    constructor(logger, userService, mfaService, passwordUtility, globalConfig) {
        this.logger = logger;
        this.userService = userService;
        this.mfaService = mfaService;
        this.passwordUtility = passwordUtility;
        this.globalConfig = globalConfig;
    }
    isManagedByEnv(user) {
        const { instanceSettingsLoader } = this.globalConfig;
        return (instanceSettingsLoader.ownerManagedByEnv &&
            !!user.email &&
            user.email.toLowerCase() === instanceSettingsLoader.ownerEmail.toLowerCase());
    }
    async assertMayApplyEmailChange(user) {
        if (this.isManagedByEnv(user)) {
            throw new errors_1.ForbiddenError('This account is managed via environment variables and cannot be modified through the API');
        }
        const ssoIdentity = await this.userService.findSsoIdentity(user.id);
        if (ssoIdentity && this.isAuthIdentityActive(ssoIdentity)) {
            this.logger.debug(`Request to change email failed because ${ssoIdentity.providerType} user may not change their profile information`, { userId: user.id });
            throw new errors_1.BadRequestError(`${ssoIdentity.providerType.toUpperCase()} user may not change their profile information`);
        }
        if ((0, sso_helpers_1.isSamlLicensedAndEnabled)()) {
            this.logger.debug('Request to change email failed because SAML user may not change their email', { userId: user.id });
            throw new errors_1.BadRequestError('SAML user may not change their email');
        }
    }
    async assertMayRequestEmailChange(user, { currentPassword, mfaCode }) {
        await this.assertMayApplyEmailChange(user);
        if (user.mfaEnabled) {
            if (!mfaCode) {
                throw new errors_1.BadRequestError('Two-factor code is required to change email');
            }
            const isMfaCodeValid = await this.mfaService.validateMfa(user.id, mfaCode, undefined);
            if (!isMfaCodeValid) {
                throw new invalid_mfa_code_error_1.InvalidMfaCodeError();
            }
            return;
        }
        if (user.password === null) {
            this.logger.debug('User with no password changed their email', { userId: user.id });
            return;
        }
        if (!currentPassword || typeof currentPassword !== 'string') {
            throw new errors_1.BadRequestError('Current password is required to change email');
        }
        const isProvidedPasswordCorrect = await this.passwordUtility.compare(currentPassword, user.password);
        if (!isProvidedPasswordCorrect) {
            throw new errors_1.BadRequestError('Unable to update profile. Please check your credentials and try again.');
        }
    }
    isAuthIdentityActive(authIdentity) {
        return authIdentity.providerType === (0, sso_helpers_1.getCurrentAuthenticationMethod)();
    }
};
exports.EmailChangeService = EmailChangeService;
exports.EmailChangeService = EmailChangeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, user_service_1.UserService, mfa_service_1.MfaService, password_utility_1.PasswordUtility, config_1.GlobalConfig])
], EmailChangeService);
//# sourceMappingURL=email-change.service.js.map