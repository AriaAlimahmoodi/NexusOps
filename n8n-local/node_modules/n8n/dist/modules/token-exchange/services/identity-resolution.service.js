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
exports.IdentityResolutionService = void 0;
exports.qualifiedProviderId = qualifiedProviderId;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const node_crypto_1 = require("node:crypto");
const user_service_1 = require("../../../services/user.service");
const token_exchange_config_1 = require("../token-exchange.config");
const token_exchange_errors_1 = require("../token-exchange.errors");
const token_exchange_types_1 = require("../token-exchange.types");
const trusted_key_service_1 = require("./trusted-key.service");
const INVALID_PASSWORD_PLACEHOLDER = '!token-exchange-no-password';
const MAX_NAME_LENGTH = 32;
function trimName(value, fallback = '') {
    return (value ?? fallback).slice(0, MAX_NAME_LENGTH);
}
function qualifiedProviderId(issuer, sub) {
    return `${(0, node_crypto_1.createHash)('sha256').update(issuer).digest('hex')}::${sub}`;
}
let IdentityResolutionService = class IdentityResolutionService {
    constructor(logger, userRepository, authIdentityRepository, eventService, userService, trustedKeyService, roleService, config) {
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.eventService = eventService;
        this.userService = userService;
        this.trustedKeyService = trustedKeyService;
        this.roleService = roleService;
        this.config = config;
        this.logger = logger.scoped('token-exchange');
    }
    assertKeyMayActAsUser(user, allowedRoles) {
        if (this.config.excludeOwner && user.role?.slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, 'User role is not allowed for this key');
        }
        if (allowedRoles?.length && !allowedRoles.includes(user.role?.slug ?? '')) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, 'User role is not allowed for this key');
        }
    }
    assertEmailVerified(claims, tokenContext) {
        if (tokenContext?.requireVerifiedEmail && !claims.email_verified) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.EmailNotVerified, 'Email is not verified');
        }
    }
    async resolve(claims, allowedRoles, tokenContext) {
        const email = claims.email?.toLowerCase();
        const qualifiedSub = qualifiedProviderId(claims.iss, claims.sub);
        let identity = await this.authIdentityRepository.findOne({
            where: { providerId: qualifiedSub, providerType: 'token-exchange' },
            relations: { user: { role: true } },
        });
        if (identity) {
            return await this.resolveByIdentity(claims, identity, allowedRoles, tokenContext);
        }
        identity = await this.authIdentityRepository.findOne({
            where: { providerId: claims.sub, providerType: 'token-exchange' },
            relations: { user: { role: true } },
        });
        if (identity && (await this.trustedKeyService.hasSingleTrustedIssuer())) {
            await this.authIdentityRepository.update({ providerId: claims.sub, providerType: 'token-exchange' }, { providerId: qualifiedSub });
            this.eventService.emit('token-exchange-identity-rebound', {
                userId: identity.user.id,
                sub: claims.sub,
                kid: tokenContext.kid,
                issuer: tokenContext.issuer,
            });
            return await this.resolveByIdentity(claims, identity, allowedRoles, tokenContext);
        }
        if (email) {
            const existingUser = await this.userRepository.findOne({
                where: { email },
                relations: ['authIdentities', 'role'],
            });
            if (existingUser) {
                return await this.resolveByEmail(claims, email, existingUser, allowedRoles, tokenContext);
            }
        }
        if (!email) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.InvalidClaims, 'Email claim is required for user provisioning');
        }
        return await this.provisionUser(claims, email, allowedRoles, tokenContext);
    }
    async resolveByIdentity(claims, identity, allowedRoles, tokenContext) {
        this.assertKeyMayActAsUser(identity.user, allowedRoles);
        this.logger.debug('Resolved user by auth identity', { sub: claims.sub });
        const resolvedRole = await this.resolveRoleForExistingUser(claims.role, allowedRoles, identity.user.role?.slug);
        return await this.syncProfile(identity.user, claims, resolvedRole, tokenContext);
    }
    async resolveByEmail(claims, email, existingUser, allowedRoles, tokenContext) {
        this.logger.debug('Linking external identity to existing user by email', {
            sub: claims.sub,
            email,
        });
        this.assertKeyMayActAsUser(existingUser, allowedRoles);
        this.assertEmailVerified(claims, tokenContext);
        const resolvedRole = await this.resolveRoleForExistingUser(claims.role, allowedRoles, existingUser.role?.slug);
        const qualifiedSub = qualifiedProviderId(claims.iss, claims.sub);
        await this.authIdentityRepository.save(db_1.AuthIdentity.create(existingUser, qualifiedSub, 'token-exchange'));
        this.eventService.emit('token-exchange-identity-linked', {
            userId: existingUser.id,
            sub: claims.sub,
            email,
            kid: tokenContext?.kid ?? '',
            issuer: tokenContext?.issuer ?? claims.iss,
        });
        return await this.syncProfile(existingUser, claims, resolvedRole, tokenContext);
    }
    async provisionUser(claims, email, allowedRoles, tokenContext) {
        this.assertEmailVerified(claims, tokenContext);
        this.logger.debug('JIT provisioning new user', { sub: claims.sub, email });
        const jitRole = await this.resolveRoleForNewUser(claims.role, allowedRoles);
        const targetRole = jitRole ? { slug: jitRole } : db_1.GLOBAL_MEMBER_ROLE;
        const qualifiedSub = qualifiedProviderId(claims.iss, claims.sub);
        const user = await this.userRepository.manager.transaction(async (trx) => {
            const { user: newUser } = await this.userRepository.createUserWithProject({
                email,
                firstName: trimName(claims.given_name),
                lastName: trimName(claims.family_name),
                role: targetRole,
                password: INVALID_PASSWORD_PLACEHOLDER,
            }, trx);
            await trx.save(trx.create(db_1.AuthIdentity, {
                providerId: qualifiedSub,
                providerType: 'token-exchange',
                userId: newUser.id,
            }));
            return newUser;
        });
        this.eventService.emit('token-exchange-user-provisioned', {
            userId: user.id,
            sub: claims.sub,
            email,
            role: targetRole.slug,
            kid: tokenContext?.kid ?? '',
            issuer: tokenContext?.issuer ?? claims.iss,
        });
        return user;
    }
    async resolveRoleForExistingUser(roleClaim, allowedRoles, currentRole) {
        if (roleClaim === undefined)
            return undefined;
        if (currentRole === 'global:owner') {
            this.logger.debug('Skipping role sync for existing owner');
            return undefined;
        }
        const role = roleClaim;
        if (role === 'global:owner') {
            this.logger.warn('Ignoring global:owner role claim for existing user');
            return undefined;
        }
        if (!(await this.roleService.isGlobalRole(role))) {
            this.logger.warn('Unknown role claim ignored', { role });
            return undefined;
        }
        if (!(0, permissions_1.isBuiltInRole)(role) && !this.roleService.isRoleLicensed(role)) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, `Role '${role}' is not available in the current license`);
        }
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, `Role '${role}' is not allowed for this token exchange key`);
        }
        return role;
    }
    async resolveRoleForNewUser(roleClaim, allowedRoles) {
        if (roleClaim === undefined)
            return undefined;
        const role = roleClaim;
        if (role === 'global:owner') {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, 'Cannot provision global:owner role via token exchange');
        }
        if (!(await this.roleService.isGlobalRole(role))) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, `Unrecognized role '${role}' cannot be assigned to new user`);
        }
        if (!(0, permissions_1.isBuiltInRole)(role) && !this.roleService.isRoleLicensed(role)) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, `Role '${role}' is not available in the current license`);
        }
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            throw new token_exchange_errors_1.TokenExchangeAuthError(token_exchange_types_1.TokenExchangeFailureReason.RoleNotAllowed, `Role '${role}' is not allowed for this token exchange key`);
        }
        return role;
    }
    async syncProfile(user, claims, resolvedRole, tokenContext) {
        let needsReload = false;
        const profileUpdates = {};
        if (claims.given_name !== undefined) {
            const trimmed = trimName(claims.given_name);
            if (trimmed !== user.firstName) {
                profileUpdates.firstName = trimmed;
            }
        }
        if (claims.family_name !== undefined) {
            const trimmed = trimName(claims.family_name);
            if (trimmed !== user.lastName) {
                profileUpdates.lastName = trimmed;
            }
        }
        if (Object.keys(profileUpdates).length > 0) {
            await this.userRepository.update(user.id, profileUpdates);
            needsReload = true;
        }
        const previousRole = user.role?.slug;
        if (resolvedRole && resolvedRole !== previousRole) {
            await this.userService.changeUserRole(user, { newRoleName: resolvedRole });
            needsReload = true;
            if (previousRole) {
                this.eventService.emit('token-exchange-role-updated', {
                    userId: user.id,
                    previousRole,
                    newRole: resolvedRole,
                    kid: tokenContext?.kid ?? '',
                    issuer: tokenContext?.issuer ?? claims.iss,
                });
            }
        }
        if (needsReload) {
            return await this.userRepository.findOneOrFail({
                where: { id: user.id },
                relations: ['role'],
            });
        }
        return user;
    }
};
exports.IdentityResolutionService = IdentityResolutionService;
exports.IdentityResolutionService = IdentityResolutionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.UserRepository, db_1.AuthIdentityRepository, backend_services_1.EventService, user_service_1.UserService, trusted_key_service_1.TrustedKeyService, backend_services_1.RoleService, token_exchange_config_1.TokenExchangeConfig])
], IdentityResolutionService);
//# sourceMappingURL=identity-resolution.service.js.map