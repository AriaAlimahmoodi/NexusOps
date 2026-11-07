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
exports.ScimService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const password_utility_1 = require("../../services/password.utility");
const scim_user_repository_1 = require("./database/scim-user.repository");
const scim_errors_1 = require("./scim.errors");
const SSO_PROVIDER_TYPES = ['saml', 'oidc'];
const DEFAULT_ROLE_SLUG = 'global:member';
const OWNER_ROLE_SLUG = 'global:owner';
let ScimService = class ScimService {
    constructor(logger, userRepository, scimUserRepository, roleRepository, urlService, globalConfig, passwordUtility, eventService) {
        this.logger = logger;
        this.userRepository = userRepository;
        this.scimUserRepository = scimUserRepository;
        this.roleRepository = roleRepository;
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.passwordUtility = passwordUtility;
        this.eventService = eventService;
    }
    toScimUser(user) {
        const baseUrl = this.urlService.getInstanceBaseUrl();
        const externalId = user.authIdentities?.find((identity) => SSO_PROVIDER_TYPES.includes(identity.providerType))?.providerId;
        const scimUser = {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
            id: user.id,
            userName: user.email,
            externalId,
            name: {
                givenName: user.firstName || undefined,
                familyName: user.lastName || undefined,
            },
            displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
            emails: user.email
                ? [
                    {
                        value: user.email,
                        primary: true,
                    },
                ]
                : undefined,
            roles: user.role ? [{ value: user.role.slug, primary: true }] : undefined,
            active: !user.disabled,
            meta: {
                resourceType: 'User',
                created: user.createdAt.toISOString(),
                lastModified: user.updatedAt.toISOString(),
                location: `${baseUrl}/scim/v2/Users/${user.id}`,
            },
        };
        return scimUser;
    }
    parseFilter(filter) {
        const match = filter.match(/^\s*(userName|externalId)\s+eq\s+"([^"]+)"\s*$/i);
        if (!match)
            throw new scim_errors_1.ScimInvalidFilterError(filter);
        const attribute = match[1].toLowerCase() === 'username' ? 'userName' : 'externalId';
        return { attribute, value: match[2] };
    }
    async getUsers(options) {
        const { startIndex = 1, count = 100, filter } = options;
        const skip = Math.max(startIndex, 1) - 1;
        const take = Math.min(Math.max(count, 0), 1000);
        const parsed = filter ? this.parseFilter(filter) : undefined;
        const [users, totalResults] = await this.scimUserRepository.findPage({
            skip,
            take,
            filter: parsed?.attribute === 'userName'
                ? { attribute: 'userName', value: parsed.value }
                : parsed
                    ? {
                        attribute: 'externalId',
                        value: parsed.value,
                        providerTypes: SSO_PROVIDER_TYPES,
                    }
                    : undefined,
        }, {});
        const scimUsers = users.map((user) => this.toScimUser(user));
        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults,
            startIndex,
            itemsPerPage: scimUsers.length,
            Resources: scimUsers,
        };
    }
    async getUserById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['authIdentities', 'role'],
        });
        if (!user)
            return null;
        return this.toScimUser(user);
    }
    async resolveRequestedRole(roles) {
        if (!roles?.length)
            return null;
        if (roles.length > 1) {
            throw new scim_errors_1.ScimInvalidValueError('n8n users have a single global role; the roles attribute must contain exactly one entry');
        }
        const slug = roles[0].value;
        if (slug === OWNER_ROLE_SLUG) {
            throw new scim_errors_1.ScimInvalidValueError('The owner role cannot be assigned via SCIM');
        }
        const role = await this.roleRepository.findOne({ where: { slug, roleType: 'global' } });
        if (!role) {
            throw new scim_errors_1.ScimInvalidValueError(`Unknown role: ${slug}`);
        }
        return role;
    }
    resolveEmail(scimUser) {
        const emails = scimUser.emails ?? [];
        const candidate = emails.find((entry) => entry.primary)?.value ?? emails[0]?.value ?? scimUser.userName;
        if (!candidate?.includes('@')) {
            throw new scim_errors_1.ScimInvalidValueError(`Cannot determine an email address for "${scimUser.userName}". Send it in "emails", or use an address as "userName".`);
        }
        return candidate.toLowerCase();
    }
    async createUser(scimUser) {
        const email = this.resolveEmail(scimUser);
        const firstName = scimUser.name?.givenName ?? '';
        const lastName = scimUser.name?.familyName ?? '';
        const active = scimUser.active ?? true;
        const externalId = scimUser.externalId;
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new scim_errors_1.ScimConflictError('User with this userName already exists');
        }
        const providerType = this.getSsoProviderType();
        const requestedRole = await this.resolveRequestedRole(scimUser.roles);
        const createdUser = await this.scimUserRepository.createProvisioned({
            email,
            firstName,
            lastName,
            role: { slug: requestedRole?.slug ?? DEFAULT_ROLE_SLUG },
            password: await this.passwordUtility.hash((0, n8n_workflow_1.randomString)(18)),
            disabled: !active,
        }, providerType && externalId ? { providerId: externalId, providerType } : undefined, {});
        this.logger.info('SCIM: User provisioned', { userId: createdUser.id });
        this.eventService.emit('user-signed-up', {
            user: createdUser,
            userType: providerType ?? 'email',
            wasDisabledLdapUser: false,
        });
        const created = await this.getUserById(createdUser.id);
        if (!created)
            throw new scim_errors_1.ScimResourceNotFoundError(createdUser.id);
        return created;
    }
    async patchUser(id, patchRequest) {
        const user = await this.getUserEntity(id);
        const changes = new Set();
        const pending = {};
        for (const operation of patchRequest.Operations) {
            const { op, path, value } = operation;
            if (op !== 'add' && op !== 'replace')
                continue;
            if (path) {
                this.applyPathOperation(user, path, value, changes, pending);
            }
            else if (typeof value === 'object' && value !== null) {
                for (const [attribute, attributeValue] of Object.entries(value)) {
                    this.applyPathOperation(user, attribute, attributeValue, changes, pending);
                }
            }
        }
        await this.applyRoleChange(user, this.toScimRoles(pending.roles), changes);
        if (changes.size > 0) {
            await this.saveUser(user);
            this.eventService.emit('user-updated', { user, fieldsChanged: [...changes] });
        }
        const patched = await this.getUserById(user.id);
        if (!patched)
            throw new scim_errors_1.ScimResourceNotFoundError(user.id);
        return patched;
    }
    applyPathOperation(user, path, value, changes, pending) {
        switch (path) {
            case 'roles':
                pending.roles = value;
                return;
            case 'active':
                if (typeof value === 'boolean') {
                    user.disabled = !value;
                    changes.add('disabled');
                }
                return;
            case 'userName':
                if (typeof value === 'string') {
                    user.email = value.toLowerCase();
                    changes.add('email');
                }
                return;
            case 'name.givenName':
                if (typeof value === 'string') {
                    user.firstName = value;
                    changes.add('firstName');
                }
                return;
            case 'name.familyName':
                if (typeof value === 'string') {
                    user.lastName = value;
                    changes.add('lastName');
                }
                return;
            case 'name':
                if (typeof value === 'object' && value !== null) {
                    const name = value;
                    if (typeof name.givenName === 'string') {
                        user.firstName = name.givenName;
                        changes.add('firstName');
                    }
                    if (typeof name.familyName === 'string') {
                        user.lastName = name.familyName;
                        changes.add('lastName');
                    }
                }
                return;
            case 'emails':
                if (Array.isArray(value)) {
                    const primary = value.find((email) => email?.primary && typeof email.value === 'string');
                    if (primary) {
                        user.email = primary.value.toLowerCase();
                        changes.add('email');
                    }
                }
                return;
            default:
                if (/^emails\[.*\]\.value$/.test(path) && typeof value === 'string') {
                    user.email = value.toLowerCase();
                    changes.add('email');
                }
        }
    }
    async updateUser(id, scimUser) {
        const user = await this.getUserEntity(id);
        const changes = new Set();
        const email = this.resolveEmail(scimUser);
        if (email !== user.email) {
            user.email = email;
            changes.add('email');
        }
        if (scimUser.name?.givenName !== undefined && scimUser.name.givenName !== user.firstName) {
            user.firstName = scimUser.name.givenName;
            changes.add('firstName');
        }
        if (scimUser.name?.familyName !== undefined && scimUser.name.familyName !== user.lastName) {
            user.lastName = scimUser.name.familyName;
            changes.add('lastName');
        }
        if (scimUser.active !== undefined && scimUser.active === user.disabled) {
            user.disabled = !scimUser.active;
            changes.add('disabled');
        }
        await this.applyRoleChange(user, scimUser.roles, changes);
        if (changes.size > 0) {
            await this.saveUser(user);
            this.eventService.emit('user-updated', { user, fieldsChanged: [...changes] });
        }
        const updated = await this.getUserById(user.id);
        if (!updated)
            throw new scim_errors_1.ScimResourceNotFoundError(user.id);
        return updated;
    }
    async deleteUser(id) {
        const user = await this.getUserEntity(id);
        user.disabled = true;
        await this.userRepository.save(user);
        this.eventService.emit('user-updated', { user, fieldsChanged: ['disabled'] });
        this.logger.info('SCIM: User deprovisioned', { userId: user.id });
    }
    async getUserEntity(id) {
        const user = await this.userRepository.findOne({ where: { id }, relations: ['role'] });
        if (!user)
            throw new scim_errors_1.ScimResourceNotFoundError(id);
        return user;
    }
    toScimRoles(value) {
        if (!Array.isArray(value))
            return undefined;
        return value.filter((role) => typeof role === 'object' && role !== null && typeof role.value === 'string');
    }
    async applyRoleChange(user, roles, changes) {
        const requestedRole = await this.resolveRequestedRole(roles);
        if (!requestedRole || requestedRole.slug === user.role?.slug)
            return;
        if (user.role?.slug === OWNER_ROLE_SLUG) {
            throw new scim_errors_1.ScimInvalidValueError('The role of the instance owner cannot be changed via SCIM');
        }
        user.role = requestedRole;
        changes.add('role');
    }
    async saveUser(user) {
        const conflictingUser = await this.userRepository.findOne({ where: { email: user.email } });
        if (conflictingUser && conflictingUser.id !== user.id) {
            throw new scim_errors_1.ScimConflictError('User with this userName already exists');
        }
        await this.userRepository.save(user);
    }
    getSsoProviderType() {
        if (this.globalConfig.sso.oidc.loginEnabled)
            return 'oidc';
        if (this.globalConfig.sso.saml.loginEnabled)
            return 'saml';
        return null;
    }
};
exports.ScimService = ScimService;
exports.ScimService = ScimService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.UserRepository, scim_user_repository_1.ScimUserRepository, db_1.RoleRepository, backend_services_1.UrlService, config_1.GlobalConfig, password_utility_1.PasswordUtility, backend_services_1.EventService])
], ScimService);
//# sourceMappingURL=scim.service.js.map