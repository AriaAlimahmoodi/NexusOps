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
exports.ProjectService = exports.ProjectNotFoundError = exports.UnlicensedProjectRoleError = exports.TeamProjectOverQuotaError = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const email_1 = require("../user-management/email");
const ownership_service_1 = require("./ownership.service");
const INSTANCE_ACCESS_ROLE_ERROR = "This user has access through their instance role. Project roles can't change their access in this project.";
const INSTANCE_ACCESS_REMOVE_ERROR = "This user has access through their instance role and can't be removed from the project.";
class TeamProjectOverQuotaError extends n8n_workflow_1.UserError {
    constructor(limit) {
        super(`Attempted to create a new project but quota is already exhausted. You may have a maximum of ${limit} team projects.`);
    }
}
exports.TeamProjectOverQuotaError = TeamProjectOverQuotaError;
class UnlicensedProjectRoleError extends n8n_workflow_1.UserError {
    constructor(role) {
        super(`Your instance is not licensed to use role "${role}".`);
    }
}
exports.UnlicensedProjectRoleError = UnlicensedProjectRoleError;
class ProjectNotFoundError extends errors_1.NotFoundError {
    constructor(projectId) {
        super(`Could not find project with ID: ${projectId}`);
        this.projectId = projectId;
    }
    static isDefinedAndNotNull(value, projectId) {
        if (value === undefined || value === null) {
            throw new ProjectNotFoundError(projectId);
        }
    }
}
exports.ProjectNotFoundError = ProjectNotFoundError;
let ProjectService = class ProjectService {
    constructor(sharedWorkflowRepository, projectRepository, projectRelationRepository, roleService, sharedCredentialsRepository, folderRepository, licenseState, moduleRegistry, ownershipService, logger, eventService, userManagementMailer, userRepository, roleRepository) {
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.projectRepository = projectRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.roleService = roleService;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.folderRepository = folderRepository;
        this.licenseState = licenseState;
        this.moduleRegistry = moduleRegistry;
        this.ownershipService = ownershipService;
        this.logger = logger;
        this.eventService = eventService;
        this.userManagementMailer = userManagementMailer;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    get workflowService() {
        return import('../workflows/workflow.service.js').then(({ WorkflowService }) => di_1.Container.get(WorkflowService));
    }
    get credentialsService() {
        return import('../credentials/credentials.service.js').then(({ CredentialsService }) => di_1.Container.get(CredentialsService));
    }
    get ownershipTransferService() {
        return import('../services/ownership-transfer/ownership-transfer.service.js').then(({ OwnershipTransferService }) => di_1.Container.get(OwnershipTransferService));
    }
    get dataTableService() {
        return import('../modules/data-table/data-table.service.js').then(({ DataTableService }) => di_1.Container.get(DataTableService));
    }
    get secretsProvidersConnectionsService() {
        return import('../modules/external-secrets.ee/secrets-providers-connections.service.ee.js').then(({ SecretsProvidersConnectionsService }) => di_1.Container.get(SecretsProvidersConnectionsService));
    }
    get agentRepository() {
        return import('../modules/agents/repositories/agent.repository.js').then(({ AgentRepository }) => di_1.Container.get(AgentRepository));
    }
    get agentKnowledgeService() {
        return import('../modules/agents/agent-knowledge.service.js').then(({ AgentKnowledgeService }) => di_1.Container.get(AgentKnowledgeService));
    }
    get agentExecutionService() {
        return import('../modules/agents/agent-execution.service.js').then(({ AgentExecutionService }) => di_1.Container.get(AgentExecutionService));
    }
    get agentChatAttachmentService() {
        return import('../modules/agents/agent-chat-attachment.service.js').then(({ AgentChatAttachmentService }) => di_1.Container.get(AgentChatAttachmentService));
    }
    get connectionStatusProxy() {
        return import('../credentials/credential-connection-status-proxy.js').then(({ CredentialConnectionStatusProxy }) => di_1.Container.get(CredentialConnectionStatusProxy));
    }
    async deleteProject(user, projectId, { migrateToProject } = {}) {
        const workflowService = await this.workflowService;
        const credentialsService = await this.credentialsService;
        if (projectId === migrateToProject) {
            throw new errors_1.BadRequestError('Request to delete a project failed because the project to delete and the project to migrate to are the same project');
        }
        const project = await this.getProjectWithScope(user, projectId, ['project:delete']);
        ProjectNotFoundError.isDefinedAndNotNull(project, projectId);
        let targetProject = null;
        if (migrateToProject) {
            targetProject = await this.getProjectWithScope(user, migrateToProject, [
                'credential:create',
                'workflow:create',
                'dataTable:create',
            ]);
            if (!targetProject) {
                throw new errors_1.NotFoundError(`Could not find project to migrate to. ID: ${targetProject}. You may lack permissions to create workflow, credentials or data tables in the target project.`);
            }
        }
        if (project.type !== 'team') {
            throw new errors_1.ForbiddenError(`Can't delete project. Project with ID "${projectId}" is not a team project.`);
        }
        const ownedCredentials = await this.sharedCredentialsRepository.find({
            where: { projectId: project.id, role: 'credential:owner' },
            relations: { credentials: true },
        });
        if (targetProject?.type === 'personal') {
            const endUserCredentials = ownedCredentials.filter((sc) => sc.credentials.isResolvable);
            if (endUserCredentials.length > 0) {
                const names = endUserCredentials.map((sc) => `"${sc.credentials.name}"`).join(', ');
                throw new errors_1.BadRequestError(`Can't migrate end-user credentials (${names}) to a personal project. Switch them back to fixed credentials, move them to another team project, or delete this project without migrating.`);
            }
        }
        if (targetProject) {
            const ownershipTransferService = await this.ownershipTransferService;
            await ownershipTransferService.enforceTransferPolicy(project.id, targetProject.id, {
                kind: 'user',
                user,
            });
        }
        const ownedSharedWorkflows = await this.sharedWorkflowRepository.find({
            where: { projectId: project.id, role: 'workflow:owner' },
        });
        if (targetProject) {
            await this.sharedWorkflowRepository.makeOwner(ownedSharedWorkflows.map((sw) => sw.workflowId), targetProject.id);
        }
        else {
            for (const sharedWorkflow of ownedSharedWorkflows) {
                await workflowService.delete(user, sharedWorkflow.workflowId, true);
            }
        }
        if (targetProject) {
            await this.sharedCredentialsRepository.makeOwner(ownedCredentials.map((sc) => sc.credentialsId), targetProject.id);
        }
        else {
            for (const sharedCredential of ownedCredentials) {
                await credentialsService.delete(user, sharedCredential.credentials.id);
            }
        }
        if (targetProject) {
            await this.folderRepository.transferAllFoldersToProject(project.id, targetProject.id);
        }
        if (this.moduleRegistry.isActive('data-table')) {
            const dataTableService = await this.dataTableService;
            if (targetProject) {
                await dataTableService.transferDataTablesByProjectId(project.id, targetProject.id);
            }
            else {
                await dataTableService.deleteDataTableByProjectId(project.id);
            }
        }
        if (this.moduleRegistry.isActive('external-secrets')) {
            const secretsProvidersConnectionsService = await this.secretsProvidersConnectionsService;
            await secretsProvidersConnectionsService.cleanupConnectionsForProjectDeletion(project.id);
        }
        if (this.moduleRegistry.isActive('agents')) {
            const [agentRepository, agentKnowledgeService, agentExecutionService, agentChatAttachments] = await Promise.all([
                this.agentRepository,
                this.agentKnowledgeService,
                this.agentExecutionService,
                this.agentChatAttachmentService,
            ]);
            const agents = await agentRepository.findByProjectId(project.id);
            for (const agent of agents) {
                try {
                    await agentKnowledgeService.deleteAllFilesForAgent(project.id, agent.id);
                }
                catch (error) {
                    this.logger.warn('Failed to delete knowledge files on project delete', {
                        agentId: agent.id,
                        projectId: project.id,
                        error: error instanceof Error ? error.message : error,
                    });
                }
                try {
                    await agentChatAttachments.deleteByAgent(agent.id);
                }
                catch (error) {
                    this.logger.warn('Failed to delete chat attachments on project delete', {
                        agentId: agent.id,
                        projectId: project.id,
                        error: error instanceof Error ? error.message : error,
                    });
                }
                await agentKnowledgeService.destroyKnowledgeSandbox(project.id, agent.id);
                await agentExecutionService.deleteExecutionLogsForAgent(agent.id);
            }
        }
        const projectMembers = await this.projectRelationRepository.findBy({ projectId: project.id });
        const memberUserIds = projectMembers.map((pr) => pr.userId);
        await this.projectRepository.remove(project);
        if (memberUserIds.length > 0) {
            const proxy = await this.connectionStatusProxy;
            await proxy.cleanupOrphanedEntriesForUsers(memberUserIds);
        }
        this.eventService.emit('team-project-deleted', {
            userId: user.id,
            role: user.role.slug,
            projectId,
            removalType: migrateToProject !== undefined ? 'transfer' : 'delete',
            targetProjectId: migrateToProject,
        });
    }
    async findProjectsWorkflowIsIn(workflowId) {
        return await this.sharedWorkflowRepository.findProjectIds(workflowId);
    }
    async findTeamProjectsWorkflowIsIn(workflowId) {
        return await this.sharedWorkflowRepository.findTeamProjectIds(workflowId);
    }
    async addUserScopes(user, projects) {
        if (projects.length === 0)
            return [];
        const relations = await this.projectRelationRepository.find({
            where: {
                userId: user.id,
                projectId: (0, typeorm_1.In)(projects.map((p) => p.id)),
            },
            relations: ['role'],
        });
        const relationsByProject = new Map(relations.map((r) => [r.projectId, r]));
        const globalScopes = (0, permissions_1.getAuthPrincipalScopes)(user);
        return projects.map((project) => {
            const relation = relationsByProject.get(project.id);
            const projectScopes = relation?.role?.scopes?.map((s) => s.slug) ?? [];
            return Object.assign(project, {
                role: relation?.role?.slug ?? user.role.slug,
                scopes: [
                    ...new Set((0, permissions_1.combineScopes)({
                        global: globalScopes,
                        ...(projectScopes.length ? { project: projectScopes } : {}),
                    })),
                ].sort(),
            });
        });
    }
    async getAccessibleProjects(user) {
        if ((0, permissions_1.hasGlobalScope)(user, 'project:read')) {
            return await this.projectRepository.find();
        }
        return await this.projectRepository.getAccessibleProjects(user.id);
    }
    async getAccessibleProjectsAndCount(user, options) {
        const [projects, count] = (0, permissions_1.hasGlobalScope)(user, 'project:read')
            ? await this.projectRepository.findAllProjectsAndCount(options)
            : await this.projectRepository.getAccessibleProjectsAndCount(user.id, options);
        return { projects, count };
    }
    async getShareableProjectsAndCount(user, options) {
        const [projects, count] = (0, permissions_1.hasGlobalScope)(user, 'project:read')
            ? await this.projectRepository.findAllProjectsAndCount(options)
            : await this.projectRepository.getShareableProjectsAndCount(user.id, options);
        return { projects, count };
    }
    async getProjectsAndCount({ offset, limit, }) {
        const [projects, count] = await this.projectRepository.findAndCount({
            skip: offset,
            take: limit,
            order: { createdAt: 'ASC', id: 'ASC' },
        });
        return { projects, count };
    }
    async getPersonalProjectOwners(projectIds) {
        return await this.projectRelationRepository.getPersonalProjectOwners(projectIds);
    }
    async getMyProjects(user) {
        const projectRelations = await this.getProjectRelationsForUser(user);
        const otherTeamProjects = (0, permissions_1.hasGlobalScope)(user, 'project:read')
            ? await this.projectRepository.findTeamProjectsExcluding(projectRelations.map((relation) => relation.projectId))
            : [];
        const results = [];
        for (const relation of projectRelations) {
            const result = Object.assign(this.projectRepository.create(relation.project), { role: relation.role.slug, scopes: [] });
            if (result.scopes) {
                result.scopes.push(...(0, permissions_1.combineScopes)({
                    global: (0, permissions_1.getAuthPrincipalScopes)(user),
                    project: relation.role.scopes.map((scope) => scope.slug),
                }));
            }
            results.push(result);
        }
        for (const project of otherTeamProjects) {
            const result = Object.assign(this.projectRepository.create(project), {
                role: user.role.slug,
                scopes: [],
            });
            if (result.scopes) {
                result.scopes.push(...(0, permissions_1.combineScopes)({ global: (0, permissions_1.getAuthPrincipalScopes)(user) }));
            }
            results.push(result);
        }
        for (const result of results) {
            if (result.scopes) {
                result.scopes = [...new Set(result.scopes)].sort();
            }
        }
        return results;
    }
    async createTeamProject(adminUser, data, overrides = {}) {
        const limit = this.licenseState.getMaxTeamProjects();
        let project;
        try {
            project = await this.projectRepository.insertTeamProjectWithAdmin({
                name: data.name,
                icon: data.icon ?? null,
                id: overrides.id,
                description: overrides.description ?? null,
                customTelemetryTags: overrides.customTelemetryTags ?? [],
            }, adminUser.id, limit);
        }
        catch (error) {
            if (error instanceof db_1.ProjectIdConflictError)
                throw new errors_1.ConflictError(error.message);
            throw error;
        }
        if (!project)
            throw new TeamProjectOverQuotaError(limit);
        this.eventService.emit('team-project-created', {
            userId: adminUser.id,
            role: adminUser.role.slug,
            uiContext: data.uiContext,
        });
        return project;
    }
    async updateProject(user, projectId, { name, icon, description, customTelemetryTags }, { preserveCustomTelemetryTags = false } = {}) {
        const tags = preserveCustomTelemetryTags
            ? customTelemetryTags
            : customTelemetryTags
                ?.map(({ key, value }) => ({ key: key.trim(), value }))
                .filter(({ key }) => key !== '');
        const result = await this.projectRepository.update({ id: projectId, type: 'team' }, { name, icon, description, customTelemetryTags: tags });
        if (!result.affected) {
            throw new ProjectNotFoundError(projectId);
        }
        await this.ownershipService.invalidateWorkflowProjectCacheForProject(projectId);
        this.eventService.emit('team-project-updated', {
            userId: user.id,
            role: user.role.slug,
            projectId,
            ...(customTelemetryTags !== undefined
                ? { otelProjectCustomTagsCount: customTelemetryTags.length }
                : {}),
        });
    }
    async getPersonalProject(user) {
        return await this.projectRepository.getPersonalProjectForUser(user.id);
    }
    async getProjectRelationsForUser(user) {
        return await this.projectRelationRepository.findAllByUser(user.id, { withProject: true });
    }
    async syncProjectRelations(projectId, relations) {
        const project = await this.getTeamProjectWithRelations(projectId);
        this.checkRolesLicensed(project, relations);
        await this.roleService.checkRolesExist(relations.map((r) => r.role), 'project');
        const incomingByUserId = new Map(relations.map((r) => [r.userId, r.role]));
        const removedUserIds = project.projectRelations
            .filter((r) => !incomingByUserId.has(r.userId))
            .map((r) => r.userId);
        const roleChangedUserIds = project.projectRelations
            .filter((r) => {
            const newRole = incomingByUserId.get(r.userId);
            return newRole !== undefined && newRole !== r.role.slug;
        })
            .map((r) => r.userId);
        const affectedUserIds = [...new Set([...removedUserIds, ...roleChangedUserIds])];
        const proxy = await this.connectionStatusProxy;
        await this.projectRelationRepository.manager.transaction(async (em) => {
            await this.pruneRelations(em, project);
            await this.addManyRelations(em, project, relations);
            if (affectedUserIds.length > 0) {
                await proxy.cleanupOrphanedEntriesForUsers(affectedUserIds, em);
            }
        });
        const newRelations = relations.filter((relation) => !project.projectRelations.some((r) => r.userId === relation.userId));
        return { project, newRelations };
    }
    async notifyNewSharees(sharer, project, newSharees) {
        if (newSharees.length === 0)
            return;
        await this.userManagementMailer.notifyProjectShared({
            sharer,
            newSharees,
            project: { id: project.id, name: project.name },
        });
    }
    async emitProjectMembersUpdated(user, projectId) {
        const relations = await this.getProjectRelations(projectId);
        this.eventService.emit('team-project-updated', {
            userId: user.id,
            role: user.role.slug,
            members: relations.map((r) => ({ userId: r.userId, role: r.role.slug })),
            projectId,
        });
    }
    async addUsersToProject(user, projectId, relations) {
        const project = await this.getTeamProjectWithRelations(projectId);
        this.checkRolesLicensed(project, relations);
        await this.roleService.checkRolesExist(relations.map((r) => r.role), 'project');
        if (project.type === 'personal') {
            throw new errors_1.ForbiddenError("Can't add users to personal projects.");
        }
        if (relations.some((r) => r.role === permissions_1.PROJECT_OWNER_ROLE_SLUG)) {
            throw new errors_1.ForbiddenError("Can't add a personalOwner to a team project.");
        }
        const memberRelations = await this.withoutInstanceAdmins(relations);
        const existingUserIds = new Set(project.projectRelations.map((pr) => pr.userId));
        const newSharees = memberRelations.filter((relation) => !existingUserIds.has(relation.userId));
        await this.projectRelationRepository.save(memberRelations.map((relation) => ({
            projectId,
            userId: relation.userId,
            role: { slug: relation.role },
        })));
        await this.notifyNewSharees(user, project, newSharees);
        await this.emitProjectMembersUpdated(user, projectId);
    }
    async addUsersWithConflictSemantics(user, projectId, relations) {
        const project = await this.getTeamProjectWithRelations(projectId);
        this.checkRolesLicensed(project, relations);
        await this.roleService.checkRolesExist(relations.map((r) => r.role), 'project');
        const memberRelations = await this.withoutInstanceAdmins(relations);
        const existingByUserId = new Map(project.projectRelations.map((r) => [r.userId, r]));
        const added = [];
        const conflicts = [];
        for (const rel of memberRelations) {
            const existing = existingByUserId.get(rel.userId);
            if (!existing)
                continue;
            const current = existing.role?.slug;
            if (current && current !== rel.role && (0, permissions_1.isAssignableProjectRoleSlug)(current)) {
                conflicts.push({ userId: rel.userId, currentRole: current, requestedRole: rel.role });
            }
        }
        const toInsert = memberRelations.filter((rel) => !existingByUserId.has(rel.userId));
        if (toInsert.length > 0) {
            await this.projectRelationRepository.insert(toInsert.map((v) => ({
                projectId: project.id,
                userId: v.userId,
                role: { slug: v.role },
            })));
            added.push(...toInsert);
        }
        await this.notifyNewSharees(user, project, added);
        await this.emitProjectMembersUpdated(user, project.id);
        return { project, added, conflicts };
    }
    async getTeamProjectWithRelations(projectId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId, type: 'team' },
            relations: { projectRelations: { role: true } },
        });
        ProjectNotFoundError.isDefinedAndNotNull(project, projectId);
        return project;
    }
    checkRolesLicensed(project, relations) {
        for (const { role, userId } of relations) {
            const existing = project.projectRelations.find((pr) => pr.userId === userId);
            if (existing?.role?.slug !== role && !this.roleService.isRoleLicensed(role)) {
                throw new UnlicensedProjectRoleError(role);
            }
        }
    }
    async findInstanceAdminIds(userIds) {
        if (userIds.length === 0)
            return new Set();
        const users = await this.userRepository.findManyByIds(userIds, { includeRole: true });
        return new Set(users
            .filter((u) => !u.disabled &&
            (u.role?.slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG || u.role?.slug === permissions_1.GLOBAL_ADMIN_ROLE_SLUG))
            .map((u) => u.id));
    }
    async withoutInstanceAdmins(relations) {
        const instanceAdminIds = await this.findInstanceAdminIds(relations.map((r) => r.userId));
        return relations.filter((r) => !instanceAdminIds.has(r.userId));
    }
    async assertNoInstanceAdmins(userIds, message) {
        const instanceAdminIds = await this.findInstanceAdminIds(userIds);
        if (instanceAdminIds.size > 0)
            throw new errors_1.ForbiddenError(message);
    }
    isUserProjectOwner(project, userId) {
        return project.projectRelations.some((pr) => pr.userId === userId && pr.role.slug === permissions_1.PROJECT_OWNER_ROLE_SLUG);
    }
    async deleteUserFromProject(user, projectId, userId) {
        const project = await this.getTeamProjectWithRelations(projectId);
        if (this.isUserProjectOwner(project, userId)) {
            throw new errors_1.ForbiddenError('Project owner cannot be removed from the project');
        }
        await this.assertNoInstanceAdmins([userId], INSTANCE_ACCESS_REMOVE_ERROR);
        const proxy = await this.connectionStatusProxy;
        await this.projectRelationRepository.manager.transaction(async (em) => {
            await em.delete(db_1.ProjectRelation, { projectId: project.id, userId });
            await proxy.cleanupOrphanedEntriesForUsers([userId], em);
        });
        await this.emitProjectMembersUpdated(user, projectId);
    }
    async changeUserRoleInProject(user, projectId, userId, role) {
        if (role === permissions_1.PROJECT_OWNER_ROLE_SLUG) {
            throw new errors_1.ForbiddenError('Personal owner cannot be added to a team project.');
        }
        const project = await this.getTeamProjectWithRelations(projectId);
        await this.roleService.checkRolesExist([role], 'project');
        ProjectNotFoundError.isDefinedAndNotNull(project, projectId);
        await this.assertNoInstanceAdmins([userId], INSTANCE_ACCESS_ROLE_ERROR);
        const projectUserExists = project.projectRelations.some((r) => r.userId === userId);
        if (!projectUserExists) {
            throw new ProjectNotFoundError(projectId);
        }
        const currentRelation = project.projectRelations.find((r) => r.userId === userId);
        const currentRole = currentRelation?.role?.slug;
        if (currentRole !== role && !this.roleService.isRoleLicensed(role)) {
            throw new UnlicensedProjectRoleError(role);
        }
        const proxy = await this.connectionStatusProxy;
        await this.projectRelationRepository.manager.transaction(async (em) => {
            await em.update(db_1.ProjectRelation, { projectId, userId }, { role: { slug: role } });
            await proxy.cleanupOrphanedEntriesForUsers([userId], em);
        });
        await this.emitProjectMembersUpdated(user, projectId);
    }
    async pruneRelations(em, project) {
        await em.delete(db_1.ProjectRelation, { projectId: project.id });
    }
    async addManyRelations(em, project, relations) {
        await em.insert(db_1.ProjectRelation, relations.map((v) => this.projectRelationRepository.create({
            projectId: project.id,
            userId: v.userId,
            role: { slug: v.role },
        })));
    }
    async getProjectWithScope(user, projectId, scopes, entityManager) {
        const em = entityManager ?? this.projectRepository.manager;
        let where = {
            id: projectId,
        };
        if (!(0, permissions_1.hasGlobalScope)(user, scopes, { mode: 'allOf' })) {
            const projectRoles = await this.roleService.rolesWithScope('project', scopes, async () => await this.roleRepository.findAll(em));
            where = {
                ...where,
                projectRelations: {
                    role: (0, typeorm_1.In)(projectRoles),
                    userId: user.id,
                },
            };
        }
        return await em.findOne(db_1.Project, {
            where,
        });
    }
    async getProjectIdsWithScope(user, scopes, projectIds) {
        const where = {};
        if (projectIds) {
            where.id = (0, typeorm_1.In)(projectIds);
        }
        if (!(0, permissions_1.hasGlobalScope)(user, scopes, { mode: 'allOf' })) {
            const projectRoles = await this.roleService.rolesWithScope('project', scopes);
            if (!projectIds) {
                where.type = 'team';
            }
            where.projectRelations = {
                role: (0, typeorm_1.In)(projectRoles),
                userId: user.id,
            };
        }
        const projects = await this.projectRepository.find({
            where,
            select: ['id'],
        });
        return projects.map((p) => p.id);
    }
    async findExistingProjectIds(projectIds) {
        if (projectIds.length === 0)
            return new Set();
        const projects = await this.projectRepository.find({
            select: ['id'],
            where: { id: (0, typeorm_1.In)(projectIds) },
        });
        return new Set(projects.map(({ id }) => id));
    }
    async findProjectsByIdsForUser(user, projectIds, scopes) {
        if (projectIds.length === 0) {
            return [];
        }
        const where = {
            id: (0, typeorm_1.In)(projectIds),
        };
        if (!(0, permissions_1.hasGlobalScope)(user, scopes, { mode: 'allOf' })) {
            const projectRoles = await this.roleService.rolesWithScope('project', scopes);
            where.projectRelations = {
                role: (0, typeorm_1.In)(projectRoles),
                userId: user.id,
            };
        }
        return await this.projectRepository.find({
            where,
            order: { createdAt: 'ASC', id: 'ASC' },
        });
    }
    async addUser(projectId, { userId, role }, trx) {
        trx = trx ?? this.projectRelationRepository.manager;
        return await trx.save(db_1.ProjectRelation, {
            projectId,
            userId,
            role: { slug: role },
        });
    }
    async getProject(projectId) {
        return await this.projectRepository.findOneOrFail({
            where: {
                id: projectId,
            },
        });
    }
    async findProject(projectId) {
        return await this.projectRepository.findOne({ where: { id: projectId } });
    }
    async getProjectRelations(projectId) {
        return await this.projectRelationRepository.find({
            where: { projectId },
            relations: { user: true, role: true },
        });
    }
    async getImplicitProjectMembers(project) {
        if (project.type !== 'team')
            return [];
        return await this.userRepository.findEligibleByProjectOrGlobalRoles({
            projectId: project.id,
            projectRoleSlugs: [],
            globalRoleSlugs: [permissions_1.GLOBAL_OWNER_ROLE_SLUG, permissions_1.GLOBAL_ADMIN_ROLE_SLUG],
        });
    }
    async findUserIdsByProjectId(projectId) {
        return await this.projectRelationRepository.findUserIdsByProjectId(projectId);
    }
    async getProjectRelationForUserAndProject(userId, projectId) {
        return await this.projectRelationRepository.findOne({
            where: { projectId, userId },
            relations: { user: true, role: true },
        });
    }
    async getProjectMembersAndCount(projectId, { offset, limit }) {
        const [members, count] = await this.projectRelationRepository.findAndCount({
            where: { projectId },
            relations: { user: true, role: true },
            order: { createdAt: 'ASC', userId: 'ASC' },
            skip: offset,
            take: limit,
        });
        return { members, count };
    }
    async getProjectScopesForUser(user, projectId) {
        const relation = await this.getProjectRelationForUserAndProject(user.id, projectId);
        return [
            ...(0, permissions_1.combineScopes)({
                global: (0, permissions_1.getAuthPrincipalScopes)(user),
                project: relation?.role.scopes.map((scope) => scope.slug) ?? [],
            }),
        ];
    }
    async getUserOwnedOrAdminProjects(userId) {
        return await this.projectRepository.find({
            where: {
                projectRelations: {
                    userId,
                    role: (0, typeorm_1.In)([permissions_1.PROJECT_OWNER_ROLE_SLUG, permissions_1.PROJECT_ADMIN_ROLE_SLUG]),
                },
            },
        });
    }
    async getProjectCounts() {
        return await this.projectRepository.getProjectCounts();
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SharedWorkflowRepository, db_1.ProjectRepository, db_1.ProjectRelationRepository, backend_services_1.RoleService, db_1.SharedCredentialsRepository, db_1.FolderRepository, backend_common_1.LicenseState, backend_common_1.ModuleRegistry, ownership_service_1.OwnershipService, backend_common_1.Logger, backend_services_1.EventService, email_1.UserManagementMailer, db_1.UserRepository, db_1.RoleRepository])
], ProjectService);
//# sourceMappingURL=project.service.ee.js.map