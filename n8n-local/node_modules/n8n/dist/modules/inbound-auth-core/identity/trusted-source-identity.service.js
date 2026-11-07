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
exports.TrustedSourceIdentityService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const trusted_source_identity_repository_1 = require("../database/repositories/trusted-source-identity.repository");
const external_identity_1 = require("./external-identity");
function isStale(lastSeenAt) {
    return lastSeenAt === null || Date.now() - lastSeenAt.getTime() > constants_1.Time.days.toMilliseconds;
}
const PLACEHOLDER_PASSWORD = '!trusted-source-no-password';
const MAX_NAME_LENGTH = 32;
function buildContext(verified, external, subject, actor) {
    return {
        ...(actor ? { actor } : {}),
        subject,
        authMethod: 'oauth-access-token',
        subjectClaim: {
            sourceId: verified.source.id,
            issuer: verified.source.issuer,
            subject: external.subject,
        },
        clientId: external.clientId,
        tokenScopes: external.scopes,
        resource: verified.resource,
        grant: verified.grant,
        assurance: external.assurance,
    };
}
let TrustedSourceIdentityService = class TrustedSourceIdentityService extends inbound_auth_1.IdentityService {
    constructor(logger, identities, users, txRunner, eventService, roleService, roleMapping) {
        super();
        this.logger = logger;
        this.identities = identities;
        this.users = users;
        this.txRunner = txRunner;
        this.eventService = eventService;
        this.roleService = roleService;
        this.roleMapping = roleMapping;
    }
    async mapRoles(source, claims, ctx) {
        const provider = this.roleMapping.getProvider();
        if (provider === null)
            return { ok: false, reason: 'no-role' };
        const { instanceRoleRules, projectRoleRules, fallbackInstanceRole } = source.config.identity.roleMapping;
        const resolved = await provider.resolveRoles({ instanceRoleRules, projectRoleRules, fallbackInstanceRole: fallbackInstanceRole ?? '' }, {
            $claims: claims,
            $provider: 'oauth2',
        }, ctx);
        const instanceRole = resolved.instanceRole.role;
        if (instanceRole === api_types_1.BLOCK_ACCESS_ASSIGNMENT ||
            !(await this.isAssignableInstanceRole(instanceRole, ctx))) {
            return { ok: false, reason: 'no-role' };
        }
        const projectRoles = [...resolved.projectRoles.values()].map(({ projectId, role }) => ({
            projectId,
            role,
        }));
        if (!(await this.identities.projectRolesExist(projectRoles.map(({ role }) => role), ctx))) {
            return { ok: false, reason: 'no-role' };
        }
        return {
            ok: true,
            value: {
                instanceRole,
                projectRoles,
                resolved,
                managed: {
                    instanceRole: instanceRoleRules.some((rule) => rule.enabled),
                    projectRoles: projectRoleRules.some((rule) => rule.enabled),
                },
                provider,
            },
        };
    }
    async mapIfContinuous(source, claims, ctx) {
        if (source.config.identity.roleMapping.mode !== 'continuous') {
            return { ok: true, value: undefined };
        }
        return await this.mapRoles(source, claims, ctx);
    }
    async resolveByUserId(id) {
        const user = await this.users.findByIdWithRole(id);
        if (user === null)
            return { ok: false, reason: 'unknown-subject' };
        if (user.disabled)
            return { ok: false, reason: 'user-disabled' };
        return { ok: true, value: (0, db_1.principalFromUser)(user) };
    }
    async acceptBinding(source, binding, claims, ctx, mapped) {
        if (binding.status !== 'active')
            return { ok: false, reason: 'binding-inactive' };
        if (binding.user.disabled)
            return { ok: false, reason: 'user-disabled' };
        let mappedRoles = mapped;
        if (mappedRoles === undefined) {
            const result = await this.mapIfContinuous(source, claims, ctx);
            if (!result.ok)
                return result;
            mappedRoles = result.value;
        }
        if (isStale(binding.lastSeenAt)) {
            await this.identities.touchLastSeen(binding.sourceId, binding.subject, new Date(), ctx);
        }
        const continuous = mappedRoles !== undefined &&
            binding.provenance === 'jit' &&
            binding.user.role.slug !== permissions_1.GLOBAL_OWNER_ROLE_SLUG
            ? mappedRoles
            : undefined;
        return {
            ok: true,
            value: {
                principal: (0, db_1.principalFromUser)(binding.user),
                ...(continuous && {
                    onCommit: async () => {
                        await continuous.provider.applyResolvedRoles(binding.user, continuous.resolved, continuous.managed);
                        if (!continuous.managed.instanceRole ||
                            binding.user.role.slug === continuous.instanceRole)
                            return;
                        const user = await this.users.findByIdWithRole(binding.user.id);
                        return user === null ? undefined : (0, db_1.principalFromUser)(user);
                    },
                }),
            },
        };
    }
    async link(source, external, user, ctx) {
        const row = {
            sourceId: source.id,
            subject: external.subject,
            userId: user.id,
            provenance: 'claim-match',
            status: 'active',
        };
        const mapped = await this.mapIfContinuous(source, external.raw, ctx);
        if (!mapped.ok)
            return mapped;
        await this.identities.insertIfAbsent(row, ctx);
        const binding = await this.identities.findBySubject(source.id, external.subject, ctx);
        if (binding === null)
            throw new n8n_workflow_1.UnexpectedError('Binding missing after insert');
        const accepted = await this.acceptBinding(source, binding, external.raw, ctx, mapped.value);
        if (accepted.ok && binding.user.id === user.id) {
            return {
                ok: true,
                value: {
                    principal: accepted.value.principal,
                    onCommit: async () => {
                        const refreshed = await accepted.value.onCommit?.();
                        this.eventService.emit('trusted-source-identity-linked', {
                            userId: user.id,
                            sourceId: source.id,
                            subject: external.subject,
                            issuer: source.issuer,
                            provenance: 'claim-match',
                        });
                        return refreshed;
                    },
                },
            };
        }
        return accepted;
    }
    async provision(source, external, ctx) {
        const { provision } = source.config.identity;
        if (provision.human === 'off')
            return { ok: false, reason: 'provision-refused' };
        const email = external.email;
        if (email === undefined || !(0, db_1.isValidEmail)(email))
            return { ok: false, reason: 'provision-refused' };
        if (source.config.identity.roleMapping.mode === 'off')
            return { ok: false, reason: 'no-role' };
        const mapped = await this.mapRoles(source, external.raw, ctx);
        if (!mapped.ok)
            return mapped;
        const { instanceRole: role, projectRoles } = mapped.value;
        const [firstName = '', ...rest] = (external.displayName ?? '').trim().split(/\s+/);
        const user = await this.identities.createUserWithBinding(ctx, {
            email,
            firstName: firstName.slice(0, MAX_NAME_LENGTH),
            lastName: rest.join(' ').slice(0, MAX_NAME_LENGTH),
            role: {
                slug: role,
            },
            password: PLACEHOLDER_PASSWORD,
        }, {
            sourceId: source.id,
            subject: external.subject,
            provenance: 'jit',
            status: 'active',
        }, projectRoles);
        return {
            ok: true,
            value: {
                principal: (0, db_1.principalFromUser)(user),
                onCommit: async () => {
                    this.eventService.emit('trusted-source-user-provisioned', {
                        userId: user.id,
                        sourceId: source.id,
                        subject: external.subject,
                        issuer: source.issuer,
                        role,
                    });
                    return undefined;
                },
            },
        };
    }
    async isAssignableInstanceRole(slug, ctx) {
        if (slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG)
            return false;
        if (!(await this.identities.globalRoleExists(slug, ctx)))
            return false;
        return this.roleService.isRoleLicensed(slug);
    }
    async linkOrProvision(source, external, ctx) {
        const { linkByEmail } = source.config.identity;
        if (linkByEmail === 'off')
            return { ok: false, reason: 'link-refused' };
        const mayUseEmail = linkByEmail === 'any' || (linkByEmail === 'verified-only' && external.emailVerified === true);
        const email = mayUseEmail ? external.email : undefined;
        if (email !== undefined) {
            const user = await this.identities.findUserByEmail(email, ctx);
            if (user !== null) {
                if (user.disabled)
                    return { ok: false, reason: 'user-disabled' };
                if (user.role.slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG)
                    return { ok: false, reason: 'link-refused' };
                return await this.link(source, external, user, ctx);
            }
        }
        return await this.provision(source, { ...external, email }, ctx);
    }
    async resolveBinding(source, external) {
        const result = await this.txRunner.run({}, async (ctx) => {
            const binding = await this.identities.findBySubject(source.id, external.subject, ctx);
            if (binding !== null)
                return await this.acceptBinding(source, binding, external.raw, ctx);
            return await this.linkOrProvision(source, external, ctx);
        });
        if (result.ok) {
            const refreshed = await result.value.onCommit?.();
            return { ok: true, value: refreshed ?? result.value.principal };
        }
        return result;
    }
    async identify(verified) {
        const { source } = verified;
        const identity = source.config.identity;
        const translated = (0, external_identity_1.translateClaims)(verified.claims, identity.claimMapping, this.logger);
        if (!translated.ok)
            return translated;
        const externalIdentity = translated.value;
        const resolved = identity.subject === 'n8n-user-id'
            ? await this.resolveByUserId(externalIdentity.subject)
            : await this.resolveBinding(source, externalIdentity);
        if (!resolved.ok)
            return resolved;
        return {
            ok: true,
            value: buildContext(verified, externalIdentity, resolved.value),
        };
    }
};
exports.TrustedSourceIdentityService = TrustedSourceIdentityService;
exports.TrustedSourceIdentityService = TrustedSourceIdentityService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, trusted_source_identity_repository_1.TrustedSourceIdentityRepository, db_1.UserRepository, db_1.TransactionRunner, backend_services_1.EventService, backend_services_1.RoleService, auth_1.RoleMappingProxyService])
], TrustedSourceIdentityService);
//# sourceMappingURL=trusted-source-identity.service.js.map