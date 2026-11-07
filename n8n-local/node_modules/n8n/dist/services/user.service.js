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
exports.UserService = exports.CHANGE_ROLE_ERROR_MESSAGES = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const ownership_service_1 = require("./ownership.service");
const project_service_ee_1 = require("./project.service.ee");
const public_api_key_service_1 = require("./public-api-key.service");
const constants_1 = require("../constants");
const errors_1 = require("@n8n/errors");
const external_hooks_1 = require("../external-hooks");
const license_1 = require("../license");
const sso_helpers_1 = require("../sso.ee/sso-helpers");
const email_1 = require("../user-management/email");
exports.CHANGE_ROLE_ERROR_MESSAGES = {
    NO_USER: 'Target user not found',
    NO_ADMIN_ON_OWNER: 'Admin cannot change role on global owner',
    NO_OWNER_ON_OWNER: 'Owner cannot change role on global owner',
    CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own global role',
    INSTANCE_ROLES_MANAGED: 'Instance roles are managed automatically and cannot be changed manually',
};
let UserService = class UserService {
    constructor(logger, userRepository, projectRepository, mailer, urlService, eventService, ownershipService, publicApiKeyService, roleService, globalConfig, jwtService, projectService, license, externalHooks, sharedCredentialsRepository, sharedWorkflowRepository) {
        this.logger = logger;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.mailer = mailer;
        this.urlService = urlService;
        this.eventService = eventService;
        this.ownershipService = ownershipService;
        this.publicApiKeyService = publicApiKeyService;
        this.roleService = roleService;
        this.globalConfig = globalConfig;
        this.jwtService = jwtService;
        this.projectService = projectService;
        this.license = license;
        this.externalHooks = externalHooks;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
    }
    async update(userId, data) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (user) {
            await this.userRepository.save({ ...user, ...data }, { transaction: true });
        }
        return;
    }
    getManager() {
        return this.userRepository.manager;
    }
    async assertGetUsersAccess(user, projectId) {
        if (projectId) {
            const project = await this.projectService.getProjectWithScope(user, projectId, [
                'project:list',
            ]);
            if (!project) {
                throw new errors_1.NotFoundError('Project not found');
            }
            return;
        }
    }
    async updateSettings(userId, newSettings) {
        const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
        if (user.settings) {
            Object.assign(user.settings, newSettings);
        }
        else {
            user.settings = newSettings;
        }
        await this.userRepository.save(user);
    }
    async findUserWithAuthIdentities(userId) {
        return await this.userRepository.findOneOrFail({
            where: { id: userId },
            relations: ['role', 'authIdentities'],
        });
    }
    async findSsoIdentity(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['authIdentities'],
        });
        const ssoIdentity = user?.authIdentities?.find((identity) => identity.providerType !== 'email');
        return ssoIdentity;
    }
    async toPublic(user, options) {
        const { password, updatedAt, authIdentities, mfaRecoveryCodes, mfaSecret, role, ...rest } = user;
        const providerType = authIdentities?.[0]?.providerType;
        let publicUser = {
            ...rest,
            role: role?.slug,
            signInType: providerType ?? 'email',
            isOwner: user.role.slug === 'global:owner',
        };
        if (options?.posthog) {
            publicUser = await this.addFeatureFlags(publicUser, options.posthog);
        }
        if (options?.withScopes) {
            publicUser.globalScopes = (0, permissions_1.getGlobalScopes)(user);
        }
        publicUser.mfaAuthenticated = options?.mfaAuthenticated ?? false;
        const { instanceSettingsLoader } = this.globalConfig;
        if (instanceSettingsLoader.ownerManagedByEnv &&
            !!user.email &&
            user.email.toLowerCase() === instanceSettingsLoader.ownerEmail.toLowerCase()) {
            publicUser.isManagedByEnv = true;
        }
        return publicUser;
    }
    async addFeatureFlags(publicUser, posthog) {
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(publicUser);
            }, 1500);
        });
        const fetchPromise = new Promise(async (resolve) => {
            const { featureFlags, featureFlagPayloads } = await posthog.getFeatureFlagsAndPayloads(publicUser);
            publicUser.featureFlags = featureFlags;
            publicUser.featureFlagPayloads = featureFlagPayloads;
            resolve(publicUser);
        });
        return await Promise.race([fetchPromise, timeoutPromise]);
    }
    async sendEmails(owner, toInviteUsers, role) {
        const domain = this.urlService.getInstanceBaseUrl();
        const inviteLinksEmailOnly = this.globalConfig.userManagement.inviteLinksEmailOnly;
        return await Promise.all(Object.entries(toInviteUsers).map(async ([email, id]) => {
            const token = this.jwtService.sign('invite', {
                inviterId: owner.id,
                inviteeId: id,
            }, {
                expiresIn: '90d',
            });
            const inviteAcceptUrl = `${domain}/signup?token=${token}`;
            const invitedUser = {
                user: {
                    id,
                    email,
                    emailSent: false,
                    role,
                },
                error: '',
            };
            try {
                const result = await this.mailer.invite({
                    email,
                    inviteAcceptUrl,
                });
                if (result.emailSent) {
                    invitedUser.user.emailSent = true;
                    this.eventService.emit('user-transactional-email-sent', {
                        userId: id,
                        messageType: 'New user invite',
                        publicApi: false,
                    });
                }
                if (!inviteLinksEmailOnly && !result.emailSent) {
                    invitedUser.user.inviteAcceptUrl = inviteAcceptUrl;
                }
                this.eventService.emit('user-invited', {
                    user: owner,
                    targetUserId: Object.values(toInviteUsers),
                    publicApi: false,
                    emailSent: result.emailSent,
                    inviteeRole: role,
                });
            }
            catch (e) {
                if (e instanceof Error) {
                    this.eventService.emit('email-failed', {
                        user: owner,
                        messageType: 'New user invite',
                        publicApi: false,
                    });
                    this.logger.error('Failed to send email', {
                        userId: owner.id,
                        email,
                    });
                    invitedUser.error = e.message;
                }
            }
            return invitedUser;
        }));
    }
    async inviteUsers(owner, invitations) {
        const emails = invitations.map(({ email }) => email);
        const existingUsers = await this.userRepository.findManyByEmail(emails);
        const existUsersEmails = existingUsers.map((user) => user.email);
        const toCreateUsers = invitations.filter(({ email }) => !existUsersEmails.includes(email));
        const pendingUsersToInvite = existingUsers.filter((email) => email.isPending);
        const createdUsers = new Map();
        this.logger.debug(toCreateUsers.length > 1
            ? `Creating ${toCreateUsers.length} user shells...`
            : 'Creating 1 user shell...');
        await this.roleService.checkRolesExist(invitations.map(({ role }) => role), 'global');
        try {
            await this.getManager().transaction(async (transactionManager) => await Promise.all(toCreateUsers.map(async ({ email, role }) => {
                const { user: savedUser } = await this.userRepository.createUserWithProject({
                    email,
                    role: {
                        slug: role,
                    },
                }, transactionManager);
                createdUsers.set(email, savedUser.id);
                return savedUser;
            })));
        }
        catch (error) {
            this.logger.error('Failed to create user shells', { userShells: createdUsers });
            throw new errors_1.InternalServerError('An error occurred during user creation', error);
        }
        pendingUsersToInvite.forEach(({ email, id }) => createdUsers.set(email, id));
        const usersInvited = await this.sendEmails(owner, Object.fromEntries(createdUsers), invitations[0].role);
        return { usersInvited, usersCreated: toCreateUsers.map(({ email }) => email) };
    }
    async changeUserRole(user, newRole) {
        await this.roleService.checkRolesExist([newRole.newRoleName], 'global');
        if (!(0, permissions_1.isBuiltInRole)(newRole.newRoleName) &&
            !this.roleService.isRoleLicensed(newRole.newRoleName)) {
            throw new errors_1.ForbiddenError(`The role "${newRole.newRoleName}" is not available in your current license.`);
        }
        await this.userRepository.manager.transaction(async (trx) => {
            await trx.update(db_1.User, { id: user.id }, { role: { slug: newRole.newRoleName } });
            const isAdminRole = (roleName) => {
                return roleName === 'global:admin' || roleName === 'global:owner';
            };
            const isDowngradedToChatUser = user.role.slug !== 'global:chatUser' && newRole.newRoleName === 'global:chatUser';
            const isUpgradedChatUser = user.role.slug === 'global:chatUser' && newRole.newRoleName !== 'global:chatUser';
            const isDowngradedAdmin = isAdminRole(user.role.slug) && !isAdminRole(newRole.newRoleName);
            if (isDowngradedToChatUser) {
                const projectRelations = await trx.find(db_1.ProjectRelation, {
                    where: { userId: user.id, role: { slug: (0, db_1.Not)(permissions_1.PROJECT_OWNER_ROLE_SLUG) } },
                    relations: ['role'],
                });
                for (const relation of projectRelations) {
                    if (relation.role.slug === permissions_1.PROJECT_ADMIN_ROLE_SLUG) {
                        const adminCount = await trx.count(db_1.ProjectRelation, {
                            where: {
                                projectId: relation.projectId,
                                role: { slug: (0, db_1.In)([permissions_1.PROJECT_ADMIN_ROLE_SLUG, permissions_1.PROJECT_OWNER_ROLE_SLUG]) },
                                userId: (0, db_1.Not)(user.id),
                            },
                        });
                        if (adminCount === 0) {
                            throw new n8n_workflow_1.UserError(`Cannot downgrade user as they are the only project admin in project "${relation.projectId}".`);
                        }
                    }
                    await trx.delete(db_1.ProjectRelation, {
                        userId: user.id,
                        projectId: relation.projectId,
                    });
                }
                const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(user.id, trx);
                await trx.update(db_1.ProjectRelation, {
                    userId: user.id,
                    role: { slug: permissions_1.PROJECT_OWNER_ROLE_SLUG },
                    projectId: personalProject.id,
                }, { role: { slug: permissions_1.PROJECT_VIEWER_ROLE_SLUG } });
                await this.publicApiKeyService.deleteAllApiKeysForUser(user, trx);
            }
            else if (isDowngradedAdmin) {
                await this.publicApiKeyService.removeOwnerOnlyScopesFromApiKeys(user, trx);
            }
            else if (isUpgradedChatUser) {
                const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(user.id, trx);
                await trx.update(db_1.ProjectRelation, {
                    userId: user.id,
                    role: { slug: permissions_1.PROJECT_VIEWER_ROLE_SLUG },
                    projectId: personalProject.id,
                }, { role: { slug: permissions_1.PROJECT_OWNER_ROLE_SLUG } });
            }
        });
        await this.ownershipService.invalidateProjectOwnerCacheByUserId(user.id);
    }
    async processTokenBasedInvite(token) {
        try {
            const decoded = this.jwtService.verify('invite', token);
            if (!decoded.inviterId || !decoded.inviteeId) {
                this.logger.debug('Invalid JWT token payload - missing inviterId or inviteeId');
                throw new errors_1.BadRequestError('Invalid invite URL');
            }
            return { inviterId: decoded.inviterId, inviteeId: decoded.inviteeId };
        }
        catch (error) {
            if (error instanceof errors_1.BadRequestError) {
                throw error;
            }
            this.logger.debug('Failed to verify JWT token', { error });
            throw new errors_1.BadRequestError('Invalid invite URL');
        }
    }
    async getInvitationIdsFromPayload(token) {
        const instanceOwner = await this.userRepository.findOne({
            where: { role: { slug: db_1.GLOBAL_OWNER_ROLE.slug } },
        });
        if (!instanceOwner) {
            throw new errors_1.BadRequestError('Instance owner not found');
        }
        return await this.processTokenBasedInvite(token);
    }
    async getUser(withIdentifier) {
        return (0, uuid_1.validate)(withIdentifier)
            ? await this.userRepository.findByIdWithRole(withIdentifier)
            : await this.userRepository.findByEmailWithRole(withIdentifier);
    }
    async getUsersAndCount(options) {
        const listOptions = { includeRole: true, offset: options.offset, limit: options.limit };
        const users = options.ids
            ? await this.userRepository.findManyByIds(options.ids, listOptions)
            : await this.userRepository.findMany(listOptions);
        const count = await this.userRepository.count();
        return { users, count };
    }
    async inviteUser(inviter, invitations) {
        if (invitations.length === 0)
            return [];
        if ((0, sso_helpers_1.isSsoCurrentAuthenticationMethod)()) {
            this.logger.debug('SSO is enabled, so users are managed by the Identity Provider and cannot be added through invites');
            throw new errors_1.BadRequestError('SSO is enabled, so users are managed by the Identity Provider and cannot be added through invites');
        }
        if (!this.license.isWithinUsersLimit()) {
            this.logger.debug('Request to send email invite(s) to user(s) failed because the user limit quota has been reached');
            throw new errors_1.ForbiddenError(constants_1.RESPONSE_ERROR_MESSAGES.USERS_QUOTA_REACHED);
        }
        if (!(await this.ownershipService.hasInstanceOwner())) {
            this.logger.debug('Request to send email invite(s) to user(s) failed because the owner account is not set up');
            throw new errors_1.BadRequestError('You must set up your own account before inviting others');
        }
        const attributes = invitations.map(({ email, role }) => {
            if (role === 'global:admin' && !this.license.isAdvancedPermissionsLicensed()) {
                throw new errors_1.ForbiddenError('Cannot invite admin user without advanced permissions. Please upgrade to a license that includes this feature.');
            }
            return { email, role };
        });
        const { usersInvited, usersCreated } = await this.inviteUsers(inviter, attributes);
        await this.externalHooks.run('user.invited', [usersCreated]);
        return usersInvited;
    }
    async deleteUser(actor, idToDelete, transferId) {
        if (actor.id === idToDelete) {
            this.logger.debug('Request to delete a user failed because it attempted to delete the requesting user', { userId: actor.id });
            throw new errors_1.BadRequestError('Cannot delete your own user');
        }
        const userToDelete = await this.userRepository.findByIdWithRole(idToDelete);
        if (!userToDelete) {
            throw new errors_1.NotFoundError('Request to delete a user failed because the user to delete was not found in DB');
        }
        if (userToDelete.role.slug === db_1.GLOBAL_OWNER_ROLE.slug) {
            throw new errors_1.ForbiddenError('Instance owner cannot be deleted.');
        }
        const personalProjectToDelete = await this.projectRepository.getPersonalProjectForUserOrFail(userToDelete.id);
        if (transferId === personalProjectToDelete.id) {
            throw new errors_1.BadRequestError('Request to delete a user failed because the user to delete and the transferee are the same user');
        }
        let transfereeId;
        let transfereeProject = null;
        if (transferId) {
            transfereeProject = await this.projectService.findProject(transferId);
            if (!transfereeProject) {
                throw new errors_1.NotFoundError('Request to delete a user failed because the transferee project was not found in DB');
            }
            const transferee = await this.userRepository.findOneByProjectIdOrFail(transfereeProject.id);
            transfereeId = transferee.id;
            const ownershipTransferService = await this.getOwnershipTransferService();
            await ownershipTransferService.enforceTransferPolicy(personalProjectToDelete.id, transfereeProject.id, { kind: 'user', user: actor });
            await ownershipTransferService.transferAllResources([personalProjectToDelete.id], transfereeProject.id);
        }
        const [ownedSharedWorkflows, ownedSharedCredentials] = await Promise.all([
            this.sharedWorkflowRepository.find({
                select: { workflowId: true },
                where: { projectId: personalProjectToDelete.id, role: 'workflow:owner' },
            }),
            this.sharedCredentialsRepository.find({
                relations: { credentials: true },
                where: { projectId: personalProjectToDelete.id, role: 'credential:owner' },
            }),
        ]);
        const ownedCredentials = ownedSharedCredentials.map(({ credentials }) => credentials);
        const workflowService = await this.getWorkflowService();
        for (const { workflowId } of ownedSharedWorkflows) {
            await workflowService.delete(userToDelete, workflowId, true);
        }
        const credentialsService = await this.getCredentialsService();
        for (const credential of ownedCredentials) {
            await credentialsService.delete(userToDelete, credential.id);
        }
        if (!transfereeProject) {
            const ownershipTransferService = await this.getOwnershipTransferService();
            await ownershipTransferService.deleteModuleOwnedResources([personalProjectToDelete.id]);
        }
        await this.getManager().transaction(async (trx) => {
            await trx.delete(db_1.AuthIdentity, { userId: userToDelete.id });
            await trx.delete(db_1.Project, { id: personalProjectToDelete.id });
            await trx.delete(db_1.User, { id: userToDelete.id });
        });
        this.eventService.emit('user-deleted', {
            user: actor,
            publicApi: false,
            targetUserOldStatus: userToDelete.isPending ? 'invited' : 'active',
            targetUserId: idToDelete,
            migrationStrategy: transferId ? 'transfer_data' : 'delete_data',
            migrationUserId: transfereeId,
        });
        await this.externalHooks.run('user.deleted', [await this.toPublic(userToDelete)]);
        return { success: true };
    }
    async changeGlobalRole(actor, id, payload) {
        const provisioningService = await this.getProvisioningService();
        if (await provisioningService.isInstanceRoleManaged()) {
            throw new errors_1.ForbiddenError(exports.CHANGE_ROLE_ERROR_MESSAGES.INSTANCE_ROLES_MANAGED);
        }
        if (actor.id === id) {
            throw new errors_1.ForbiddenError(exports.CHANGE_ROLE_ERROR_MESSAGES.CANNOT_CHANGE_OWN_ROLE);
        }
        const targetUser = await this.userRepository.findByIdWithRole(id);
        if (targetUser === null) {
            throw new errors_1.NotFoundError(exports.CHANGE_ROLE_ERROR_MESSAGES.NO_USER);
        }
        if (actor.role.slug === db_1.GLOBAL_ADMIN_ROLE.slug &&
            targetUser.role.slug === db_1.GLOBAL_OWNER_ROLE.slug) {
            throw new errors_1.ForbiddenError(exports.CHANGE_ROLE_ERROR_MESSAGES.NO_ADMIN_ON_OWNER);
        }
        if (actor.role.slug === db_1.GLOBAL_OWNER_ROLE.slug &&
            targetUser.role.slug === db_1.GLOBAL_OWNER_ROLE.slug) {
            throw new errors_1.ForbiddenError(exports.CHANGE_ROLE_ERROR_MESSAGES.NO_OWNER_ON_OWNER);
        }
        await this.changeUserRole(targetUser, payload);
        this.eventService.emit('user-changed-role', {
            userId: actor.id,
            targetUserId: targetUser.id,
            targetUserNewRole: payload.newRoleName,
            publicApi: false,
        });
        return { success: true };
    }
    async getProvisioningService() {
        const { ProvisioningService } = await import('../modules/provisioning.ee/provisioning.service.ee.js');
        return di_1.Container.get(ProvisioningService);
    }
    async getWorkflowService() {
        const { WorkflowService } = await import('../workflows/workflow.service.js');
        return di_1.Container.get(WorkflowService);
    }
    async getCredentialsService() {
        const { CredentialsService } = await import('../credentials/credentials.service.js');
        return di_1.Container.get(CredentialsService);
    }
    async getOwnershipTransferService() {
        const { OwnershipTransferService } = await import('../services/ownership-transfer/ownership-transfer.service.js');
        return di_1.Container.get(OwnershipTransferService);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.UserRepository, db_1.ProjectRepository, email_1.UserManagementMailer, backend_services_1.UrlService, backend_services_1.EventService, ownership_service_1.OwnershipService, public_api_key_service_1.PublicApiKeyService, backend_services_1.RoleService, config_1.GlobalConfig, backend_services_1.JwtService, project_service_ee_1.ProjectService, license_1.License, external_hooks_1.ExternalHooks, db_1.SharedCredentialsRepository, db_1.SharedWorkflowRepository])
], UserService);
//# sourceMappingURL=user.service.js.map