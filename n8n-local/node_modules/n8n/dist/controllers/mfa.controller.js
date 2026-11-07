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
exports.MFAController = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const auth_service_1 = require("../auth/auth.service");
const errors_1 = require("@n8n/errors");
const external_hooks_1 = require("../external-hooks");
const mfa_service_1 = require("../mfa/mfa.service");
let MFAController = class MFAController {
    constructor(mfaService, externalHooks, authService, userRepository, eventService, instanceSettingsLoaderConfig) {
        this.mfaService = mfaService;
        this.externalHooks = externalHooks;
        this.authService = authService;
        this.userRepository = userRepository;
        this.eventService = eventService;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
    }
    async enforceMFA(req) {
        if (this.instanceSettingsLoaderConfig.securityPolicyManagedByEnv) {
            throw new errors_1.ForbiddenError('MFA enforcement is managed via environment variables and cannot be modified through the API');
        }
        if (req.body.enforce && !(req.authInfo?.usedMfa ?? false)) {
            throw new errors_1.BadRequestError('You must enable two-factor authentication on your own account before enforcing it for all users');
        }
        await this.mfaService.enforceMFA(req.body.enforce);
        this.eventService.emit('instance-policies-updated', {
            user: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
            },
            settingName: '2fa_enforcement',
            value: req.body.enforce,
        });
        return;
    }
    async canEnableMFA(req) {
        await this.externalHooks.run('mfa.beforeSetup', [req.user]);
        return;
    }
    async getQRCode(req) {
        const { email, id, mfaEnabled } = req.user;
        if (mfaEnabled)
            throw new errors_1.BadRequestError('MFA already enabled. Disable it to generate new secret and recovery codes');
        const { decryptedSecret: secret, decryptedRecoveryCodes: recoveryCodes } = await this.mfaService.getSecretAndRecoveryCodes(id);
        if (secret && recoveryCodes.length) {
            const qrCode = this.mfaService.totp.generateTOTPUri({
                secret,
                label: email,
            });
            return {
                secret,
                recoveryCodes,
                qrCode,
            };
        }
        const newRecoveryCodes = this.mfaService.generateRecoveryCodes();
        const newSecret = this.mfaService.totp.generateSecret();
        const qrCode = this.mfaService.totp.generateTOTPUri({ secret: newSecret, label: email });
        await this.mfaService.saveSecretAndRecoveryCodes(id, newSecret, newRecoveryCodes);
        return {
            secret: newSecret,
            qrCode,
            recoveryCodes: newRecoveryCodes,
        };
    }
    async activateMFA(req, res) {
        const { mfaCode = null } = req.body;
        const { id, mfaEnabled } = req.user;
        await this.externalHooks.run('mfa.beforeSetup', [req.user]);
        const { decryptedSecret: secret, decryptedRecoveryCodes: recoveryCodes } = await this.mfaService.getSecretAndRecoveryCodes(id);
        if (!mfaCode)
            throw new errors_1.BadRequestError('Token is required to enable MFA feature');
        if (mfaEnabled)
            throw new errors_1.BadRequestError('MFA already enabled');
        if (!secret || !recoveryCodes.length) {
            throw new errors_1.BadRequestError('Cannot enable MFA without generating secret and recovery codes');
        }
        const verified = this.mfaService.totp.verifySecret({ secret, mfaCode, window: 10 });
        if (!verified)
            throw new errors_1.BadRequestError('MFA code expired. Close the modal and enable MFA again', 997);
        const updatedUser = await this.mfaService.enableMfa(id);
        this.eventService.emit('user-mfa-enabled', {
            user: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
            },
        });
        this.authService.issueCookie(res, updatedUser, verified, req.browserId);
    }
    async disableMFA(req, res) {
        const { id: userId } = req.user;
        const { mfaCode, mfaRecoveryCode } = req.body;
        const mfaCodeDefined = mfaCode && typeof mfaCode === 'string';
        const mfaRecoveryCodeDefined = mfaRecoveryCode && typeof mfaRecoveryCode === 'string';
        if (!mfaCodeDefined === !mfaRecoveryCodeDefined) {
            throw new errors_1.BadRequestError('Either MFA code or recovery code is required to disable MFA feature');
        }
        if (mfaCodeDefined) {
            await this.mfaService.disableMfaWithMfaCode(userId, mfaCode);
        }
        else if (mfaRecoveryCodeDefined) {
            await this.mfaService.disableMfaWithRecoveryCode(userId, mfaRecoveryCode);
        }
        this.eventService.emit('user-mfa-disabled', {
            user: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
            },
            disableMethod: mfaCodeDefined ? 'mfaCode' : 'recoveryCode',
        });
        const updatedUser = await this.userRepository.findOneOrFail({
            where: { id: userId },
            relations: ['role'],
        });
        this.authService.issueCookie(res, updatedUser, false, req.browserId);
    }
    async verifyMFA(req) {
        const { id } = req.user;
        const { mfaCode } = req.body;
        const { decryptedSecret: secret } = await this.mfaService.getSecretAndRecoveryCodes(id);
        if (!mfaCode)
            throw new errors_1.BadRequestError('MFA code is required to enable MFA feature');
        if (!secret)
            throw new errors_1.BadRequestError('No MFA secret se for this user');
        const verified = this.mfaService.totp.verifySecret({ secret, mfaCode });
        if (!verified)
            throw new errors_1.BadRequestError('MFA secret could not be verified');
    }
};
exports.MFAController = MFAController;
__decorate([
    (0, decorators_1.Post)('/enforce-mfa'),
    (0, decorators_1.GlobalScope)('user:enforceMfa'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MFAController.prototype, "enforceMFA", null);
__decorate([
    (0, decorators_1.Post)('/can-enable', {
        allowSkipMFA: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MFAController.prototype, "canEnableMFA", null);
__decorate([
    (0, decorators_1.Get)('/qr', {
        allowSkipMFA: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MFAController.prototype, "getQRCode", null);
__decorate([
    (0, decorators_1.Post)('/enable', {
        allowSkipMFA: true,
        keyedRateLimit: (0, decorators_1.createUserKeyedRateLimiter)({}),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MFAController.prototype, "activateMFA", null);
__decorate([
    (0, decorators_1.Post)('/disable', {
        ipRateLimit: true,
        keyedRateLimit: (0, decorators_1.createUserKeyedRateLimiter)({}),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MFAController.prototype, "disableMFA", null);
__decorate([
    (0, decorators_1.Post)('/verify', {
        allowSkipMFA: true,
        keyedRateLimit: (0, decorators_1.createUserKeyedRateLimiter)({}),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MFAController.prototype, "verifyMFA", null);
exports.MFAController = MFAController = __decorate([
    (0, decorators_1.RestController)('/mfa'),
    __metadata("design:paramtypes", [mfa_service_1.MfaService, external_hooks_1.ExternalHooks, auth_service_1.AuthService, db_1.UserRepository, backend_services_1.EventService, config_1.InstanceSettingsLoaderConfig])
], MFAController);
//# sourceMappingURL=mfa.controller.js.map