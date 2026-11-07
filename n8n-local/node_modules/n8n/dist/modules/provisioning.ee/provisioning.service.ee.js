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
exports.ProvisioningService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const project_service_ee_1 = require("../../services/project.service.ee");
const user_service_1 = require("../../services/user.service");
const constants_1 = require("./constants");
const sso_access_denied_error_1 = require("./errors/sso-access-denied.error");
const role_mapping_rule_service_ee_1 = require("./role-mapping-rule.service.ee");
const role_resolver_service_ee_1 = require("./role-resolver.service.ee");
let ProvisioningService = class ProvisioningService {
    constructor(eventService, globalConfig, settingsRepository, projectRepository, projectService, roleRepository, userRepository, userService, logger, publisher, instanceSettings, roleMappingRuleRepository, roleResolverService, roleMappingRuleService) {
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.settingsRepository = settingsRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.logger = logger;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.roleMappingRuleRepository = roleMappingRuleRepository;
        this.roleResolverService = roleResolverService;
        this.roleMappingRuleService = roleMappingRuleService;
    }
    async init() {
        this.provisioningConfig = await this.loadConfig();
    }
    async getConfig() {
        if (!this.provisioningConfig) {
            this.provisioningConfig = await this.loadConfig();
        }
        return this.provisioningConfig;
    }
    async provisionInstanceRoleForUser(user, roleSlug) {
        if (!(await this.isInstanceRoleProvisioningEnabled())) {
            return;
        }
        const globalOwnerRoleSlug = permissions_1.GLOBAL_OWNER_ROLE_SLUG;
        const dbRole = await this.resolveClaimedInstanceRole(user, roleSlug);
        if (!dbRole) {
            return;
        }
        if (dbRole.slug === globalOwnerRoleSlug && user.role.slug !== globalOwnerRoleSlug) {
            this.logger.warn(`Skipping instance role provisioning. Cannot assign owner role: ${globalOwnerRoleSlug} to user: ${user.id}`, { userId: user.id, roleSlug: dbRole.slug });
            return;
        }
        if (user.role.slug === globalOwnerRoleSlug && dbRole.slug !== globalOwnerRoleSlug) {
            const otherOwners = await this.userRepository.count({
                where: { role: { slug: globalOwnerRoleSlug }, id: (0, typeorm_1.Not)(user.id) },
            });
            if (otherOwners === 0) {
                this.logger.warn(`Skipping instance role provisioning. Cannot remove last owner role: ${globalOwnerRoleSlug} from user: ${user.id}`, { userId: user.id, roleSlug: dbRole.slug });
                return;
            }
        }
        if (user.role.slug !== dbRole.slug) {
            await this.userService.changeUserRole(user, { newRoleName: dbRole.slug });
            this.eventService.emit('sso-user-instance-role-updated', {
                userId: user.id,
                role: dbRole.slug,
            });
        }
    }
    async resolveClaimedInstanceRole(user, roleSlug) {
        if (typeof roleSlug === 'string') {
            const dbRole = await this.roleRepository.findOne({ where: { slug: roleSlug } });
            if (dbRole?.roleType === 'global') {
                return dbRole;
            }
            this.logger.warn(dbRole
                ? `Instance role claim ${roleSlug} is not a global role`
                : `A role matching the claimed slug ${roleSlug} was not found`, { userId: user.id, roleSlug });
        }
        else if (roleSlug !== undefined && roleSlug !== null) {
            this.logger.warn(`Invalid instance role claim: expected string, received ${typeof roleSlug}`, { userId: user.id, roleSlug });
        }
        const { defaultInstanceRole } = await this.getConfig();
        if (!defaultInstanceRole || defaultInstanceRole === api_types_1.BLOCK_ACCESS_ASSIGNMENT) {
            return null;
        }
        const fallbackRole = await this.roleRepository.findOne({
            where: { slug: defaultInstanceRole },
        });
        if (fallbackRole?.roleType !== 'global') {
            this.logger.warn(`Skipping instance role provisioning. Default condition role ${defaultInstanceRole} is not an assignable global role`, { userId: user.id });
            return null;
        }
        this.logger.debug('Applying default condition instance role', {
            userId: user.id,
            role: fallbackRole.slug,
        });
        return fallbackRole;
    }
    async provisionProjectRolesForUser(userId, projectIdToRoles) {
        if (!(await this.isProjectRolesProvisioningEnabled())) {
            return;
        }
        if (!Array.isArray(projectIdToRoles)) {
            this.logger.warn(`Skipping project role provisioning. Invalid projectIdToRole type: expected array, received ${typeof projectIdToRoles}`, { userId, projectIdToRoles });
            return;
        }
        let projectRoleMap;
        try {
            projectRoleMap = {};
            for (const entry of projectIdToRoles) {
                if (typeof entry !== 'string') {
                    this.logger.warn(`Skipping invalid project role mapping entry. Expected string, received ${typeof entry}.`, { userId, entry });
                    continue;
                }
                const [projectId, roleSlugSuffix] = entry.split(':');
                if (!projectId || !roleSlugSuffix) {
                    this.logger.warn(`Skipping invalid project role mapping entry. Expected format "projectId:displayName", received "${entry}".`, { userId, entry });
                    continue;
                }
                projectRoleMap[projectId] = `project:${roleSlugSuffix}`;
            }
        }
        catch (error) {
            this.logger.warn('Skipping project role provisioning. Failed to parse project to role mapping.', { userId, projectIdToRoles });
            return;
        }
        const projectIds = Object.keys(projectRoleMap);
        const roleSlugs = [...new Set(Object.values(projectRoleMap))];
        if (projectIds.length === 0) {
            return;
        }
        const [existingProjects, existingRoles] = await Promise.all([
            this.projectRepository.find({
                where: { id: (0, typeorm_1.In)(projectIds), type: (0, typeorm_1.Not)('personal') },
                select: ['id'],
            }),
            this.roleRepository.find({
                where: {
                    slug: (0, typeorm_1.In)(roleSlugs),
                    roleType: 'project',
                },
                select: ['displayName', 'slug'],
            }),
        ]);
        const existingProjectIds = new Set(existingProjects.map((project) => project.id));
        const validProjectToRoleMappings = [];
        for (const [projectId, roleSlug] of Object.entries(projectRoleMap)) {
            if (!existingProjectIds.has(projectId)) {
                this.logger.warn(`Skipped provisioning project role for project with ID ${projectId}, because project does not exist or is a personal project.`, { userId, projectId, roleSlug });
                continue;
            }
            const role = existingRoles.find((role) => role.slug === roleSlug);
            if (!role) {
                this.logger.warn(`Skipping project role provisioning for role with slug ${roleSlug}, because role does not exist or is not specific to projects.`, { userId, projectId, roleSlug });
                continue;
            }
            validProjectToRoleMappings.push({ projectId, roleSlug: role.slug });
        }
        if (validProjectToRoleMappings.length === 0) {
            this.logger.warn('Skipping project role provisioning altogether. No valid project to role mappings found.', { userId, projectRoleMap });
            return;
        }
        const currentlyAccessibleProjects = await this.projectRepository.find({
            where: {
                type: (0, typeorm_1.Not)('personal'),
                projectRelations: {
                    userId,
                },
            },
            relations: ['projectRelations'],
        });
        const validProjectIds = new Set(validProjectToRoleMappings.map((m) => m.projectId));
        const projectsToRemoveAccessFrom = currentlyAccessibleProjects.filter((project) => !validProjectIds.has(project.id));
        await this.projectRepository.manager.transaction(async (tx) => {
            for (const project of projectsToRemoveAccessFrom) {
                await tx.delete(db_1.ProjectRelation, { projectId: project.id, userId });
            }
            for (const { projectId, roleSlug } of validProjectToRoleMappings) {
                await this.projectService.addUser(projectId, { userId, role: roleSlug }, tx);
            }
        });
        this.eventService.emit('sso-user-project-access-updated', {
            projectsAdded: validProjectIds.size,
            projectsRemoved: projectsToRemoveAccessFrom.length,
            userId,
        });
    }
    async patchConfig(rawConfig) {
        let patchConfig;
        try {
            patchConfig = api_types_1.ProvisioningConfigPatchDto.parse(rawConfig);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                throw new errors_1.BadRequestError(error.message);
            }
            throw error;
        }
        const currentConfig = await this.getConfig();
        const supportedPatchFields = [
            'scopesProvisionInstanceRole',
            'scopesProvisionProjectRoles',
            'scopesName',
            'scopesInstanceRoleClaimName',
            'scopesProjectsRolesClaimName',
            'scopesUseExpressionMapping',
            'defaultInstanceRole',
        ];
        const { deleteProjectRules: explicitDeleteProjectRules, ...configPatch } = patchConfig;
        const updatedConfig = {
            ...currentConfig,
            ...configPatch,
        };
        for (const supportedPatchField of supportedPatchFields) {
            if (configPatch[supportedPatchField] === null) {
                delete updatedConfig[supportedPatchField];
            }
        }
        if (updatedConfig.scopesUseExpressionMapping &&
            (updatedConfig.scopesProvisionInstanceRole || updatedConfig.scopesProvisionProjectRoles)) {
            throw new errors_1.BadRequestError('Expression-based mapping and direct-claim provisioning cannot both be enabled at the same time.');
        }
        api_types_1.ProvisioningConfigDto.parse(updatedConfig);
        await this.validateDefaultInstanceRole(updatedConfig.defaultInstanceRole);
        const previousProjectRoleManaged = currentConfig.scopesProvisionProjectRoles || currentConfig.scopesUseExpressionMapping;
        const newProjectRoleManaged = updatedConfig.scopesProvisionProjectRoles ||
            updatedConfig.scopesUseExpressionMapping;
        const shouldDeleteProjectRules = explicitDeleteProjectRules === true || (previousProjectRoleManaged && !newProjectRoleManaged);
        let deletedProjectRulesCount = 0;
        await this.settingsRepository.manager.transaction(async (tx) => {
            await tx.getRepository(db_1.Settings).upsert({
                key: constants_1.PROVISIONING_PREFERENCES_DB_KEY,
                value: JSON.stringify(updatedConfig),
                loadOnStartup: true,
            }, { conflictPaths: ['key'] });
            if (shouldDeleteProjectRules) {
                deletedProjectRulesCount = await this.roleMappingRuleService.deleteAllOfType('project', tx);
            }
        });
        if (shouldDeleteProjectRules) {
            this.eventService.emit('role-mapping-rules-bulk-deleted', {
                ruleType: 'project',
                count: deletedProjectRulesCount,
                reason: 'strategy-switch',
            });
        }
        this.provisioningConfig = await this.loadConfig();
        if (this.instanceSettings.isMultiMain) {
            await this.publisher.publishCommand({ command: 'reload-sso-provisioning-configuration' });
        }
        return await this.getConfig();
    }
    async validateDefaultInstanceRole(value) {
        if (value === undefined || value === api_types_1.BLOCK_ACCESS_ASSIGNMENT)
            return;
        const role = typeof value === 'string'
            ? await this.roleRepository.findOne({ where: { slug: value } })
            : null;
        if (!role || role.roleType !== 'global' || role.slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG) {
            throw new errors_1.BadRequestError(`defaultInstanceRole must be "${api_types_1.BLOCK_ACCESS_ASSIGNMENT}" or the slug of an assignable global role`);
        }
    }
    async handleReloadSsoProvisioningConfiguration() {
        this.provisioningConfig = await this.loadConfig();
    }
    async loadConfigurationFromDatabase() {
        const configFromDB = await this.settingsRepository.findByKey(constants_1.PROVISIONING_PREFERENCES_DB_KEY);
        if (configFromDB) {
            try {
                const configValue = (0, n8n_workflow_1.jsonParse)(configFromDB.value);
                return api_types_1.ProvisioningConfigDto.parse(configValue);
            }
            catch (error) {
                this.logger.warn('Failed to load Provisioning configuration from database, falling back to default configuration.', { error });
            }
        }
        return undefined;
    }
    async loadConfig() {
        const envProvidedConfig = api_types_1.ProvisioningConfigDto.parse(this.globalConfig.sso.provisioning);
        const dbProvidedConfig = await this.loadConfigurationFromDatabase();
        if (dbProvidedConfig) {
            return {
                ...envProvidedConfig,
                ...dbProvidedConfig,
            };
        }
        return envProvidedConfig;
    }
    async getInstanceRoleClaimName() {
        if (!(await this.isInstanceRoleProvisioningEnabled())) {
            return null;
        }
        const provisioningConfig = await this.getConfig();
        return provisioningConfig.scopesInstanceRoleClaimName;
    }
    async getProjectsRolesClaimName() {
        if (!(await this.isProjectRolesProvisioningEnabled())) {
            return null;
        }
        const provisioningConfig = await this.getConfig();
        return provisioningConfig.scopesProjectsRolesClaimName;
    }
    async isProvisioningEnabled() {
        const provisioningConfig = await this.getConfig();
        return (provisioningConfig.scopesProvisionInstanceRole ||
            provisioningConfig.scopesProvisionProjectRoles);
    }
    async isInstanceRoleProvisioningEnabled() {
        const provisioningConfig = await this.getConfig();
        return provisioningConfig.scopesProvisionInstanceRole;
    }
    async isProjectRolesProvisioningEnabled() {
        const provisioningConfig = await this.getConfig();
        return provisioningConfig.scopesProvisionProjectRoles;
    }
    async isExpressionMappingEnabled() {
        const provisioningConfig = await this.getConfig();
        return provisioningConfig.scopesUseExpressionMapping;
    }
    isScimActive() {
        return di_1.Container.get(backend_common_1.ModuleRegistry).isActive('scim');
    }
    async hasRoleMappingRulesOfType(type) {
        return (await this.roleMappingRuleRepository.count({ where: { type } })) > 0;
    }
    async isInstanceRoleManaged() {
        if (await this.isInstanceRoleProvisioningEnabled())
            return true;
        return ((await this.isExpressionMappingEnabled()) &&
            (await this.hasRoleMappingRulesOfType('instance')));
    }
    async isProjectRoleManaged() {
        if (await this.isProjectRolesProvisioningEnabled())
            return true;
        return ((await this.isExpressionMappingEnabled()) && (await this.hasRoleMappingRulesOfType('project')));
    }
    async buildRoleMappingConfig() {
        const dbRules = await this.roleMappingRuleRepository.find({
            relations: ['role', 'projects'],
            order: { order: 'ASC' },
        });
        const instanceRoleRules = [];
        const projectRoleRules = [];
        for (const dbRule of dbRules) {
            if (dbRule.type === 'instance') {
                instanceRoleRules.push({
                    id: dbRule.id,
                    expression: dbRule.expression,
                    role: dbRule.role.slug,
                    enabled: true,
                });
            }
            else {
                for (const project of dbRule.projects) {
                    projectRoleRules.push({
                        id: `${dbRule.id}:${project.id}`,
                        expression: dbRule.expression,
                        role: dbRule.role.slug,
                        projectId: project.id,
                        enabled: true,
                    });
                }
            }
        }
        const { defaultInstanceRole } = await this.getConfig();
        return {
            instanceRoleRules,
            projectRoleRules,
            fallbackInstanceRole: defaultInstanceRole ?? 'global:member',
        };
    }
    async applyResolvedRoles(user, resolved, managed) {
        if (managed.instanceRole) {
            await this.applyExpressionMappedInstanceRole(user, resolved.instanceRole.role);
        }
        if (managed.projectRoles) {
            const projectRolesMap = new Map();
            for (const [projectId, pr] of resolved.projectRoles) {
                projectRolesMap.set(projectId, pr.role);
            }
            await this.applyExpressionMappedProjectRoles(user.id, projectRolesMap);
        }
    }
    async getPreviousProjectRoles(userId) {
        const projects = await this.projectRepository.find({
            where: { type: (0, typeorm_1.Not)('personal'), projectRelations: { userId } },
            relations: ['projectRelations', 'projectRelations.role'],
        });
        const result = {};
        for (const project of projects) {
            const relation = project.projectRelations.find((r) => r.userId === userId);
            if (relation) {
                result[project.id] = relation.role.slug;
            }
        }
        return result;
    }
    async applyExpressionMappedInstanceRole(user, instanceRoleSlug) {
        if (instanceRoleSlug === api_types_1.BLOCK_ACCESS_ASSIGNMENT) {
            return;
        }
        let dbRole;
        try {
            dbRole = await this.roleRepository.findOneOrFail({ where: { slug: instanceRoleSlug } });
        }
        catch {
            this.logger.warn(`Expression mapping: skipping instance role, slug "${instanceRoleSlug}" not found`, { userId: user.id });
            return;
        }
        if (dbRole.roleType !== 'global') {
            this.logger.warn(`Expression mapping: skipping instance role, "${instanceRoleSlug}" is not a global role`, { userId: user.id });
            return;
        }
        if (dbRole.slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG && user.role.slug !== permissions_1.GLOBAL_OWNER_ROLE_SLUG) {
            this.logger.warn(`Skipping instance role provisioning. Cannot assign owner role: ${permissions_1.GLOBAL_OWNER_ROLE_SLUG} to user: ${user.id}`, { userId: user.id, roleSlug: permissions_1.GLOBAL_OWNER_ROLE_SLUG });
            return;
        }
        if (user.role.slug === permissions_1.GLOBAL_OWNER_ROLE_SLUG && dbRole.slug !== permissions_1.GLOBAL_OWNER_ROLE_SLUG) {
            const otherOwners = await this.userRepository.count({
                where: { role: { slug: permissions_1.GLOBAL_OWNER_ROLE_SLUG }, id: (0, typeorm_1.Not)(user.id) },
            });
            if (otherOwners === 0) {
                this.logger.warn('Expression mapping: skipping instance role update, cannot demote last owner', { userId: user.id });
                return;
            }
        }
        if (user.role.slug !== dbRole.slug) {
            await this.userService.changeUserRole(user, { newRoleName: dbRole.slug });
            this.eventService.emit('sso-user-instance-role-updated', {
                userId: user.id,
                role: dbRole.slug,
            });
        }
    }
    async applyExpressionMappedProjectRoles(userId, projectRoleMap) {
        const currentlyAccessibleProjects = await this.projectRepository.find({
            where: { type: (0, typeorm_1.Not)('personal'), projectRelations: { userId } },
            relations: ['projectRelations'],
        });
        const validMappings = [];
        if (projectRoleMap.size > 0) {
            const projectIds = [...projectRoleMap.keys()];
            const roleSlugs = [...new Set(projectRoleMap.values())];
            const [existingProjects, existingRoles] = await Promise.all([
                this.projectRepository.find({
                    where: { id: (0, typeorm_1.In)(projectIds), type: (0, typeorm_1.Not)('personal') },
                    select: ['id'],
                }),
                this.roleRepository.find({
                    where: { slug: (0, typeorm_1.In)(roleSlugs), roleType: 'project' },
                    select: ['displayName', 'slug'],
                }),
            ]);
            const existingProjectIds = new Set(existingProjects.map((p) => p.id));
            for (const [projectId, roleSlug] of projectRoleMap.entries()) {
                if (!existingProjectIds.has(projectId)) {
                    this.logger.warn(`Expression mapping: skipping project ${projectId}, not found or is a personal project`, { userId, projectId, roleSlug });
                    continue;
                }
                const role = existingRoles.find((r) => r.slug === roleSlug);
                if (!role) {
                    this.logger.warn(`Expression mapping: skipping role "${roleSlug}", not found or not a project role`, { userId, projectId, roleSlug });
                    continue;
                }
                validMappings.push({ projectId, roleSlug: role.slug });
            }
        }
        const validProjectIds = new Set(validMappings.map((m) => m.projectId));
        const projectsToRemoveAccessFrom = currentlyAccessibleProjects.filter((p) => !validProjectIds.has(p.id));
        if (projectsToRemoveAccessFrom.length === 0 && validMappings.length === 0)
            return;
        await this.projectRepository.manager.transaction(async (tx) => {
            for (const project of projectsToRemoveAccessFrom) {
                await tx.delete(db_1.ProjectRelation, { projectId: project.id, userId });
            }
            for (const { projectId, roleSlug } of validMappings) {
                await this.projectService.addUser(projectId, { userId, role: roleSlug }, tx);
            }
        });
        this.eventService.emit('sso-user-project-access-updated', {
            projectsAdded: validProjectIds.size,
            projectsRemoved: projectsToRemoveAccessFrom.length,
            userId,
        });
    }
    async assertSsoLoginAllowed(context, instanceRoleClaim) {
        if (await this.isExpressionMappingEnabled()) {
            if (!(await this.hasRoleMappingRulesOfType('instance'))) {
                const { defaultInstanceRole } = await this.getConfig();
                if (defaultInstanceRole === api_types_1.BLOCK_ACCESS_ASSIGNMENT) {
                    this.logger.warn('SSO login blocked by role mapping', {
                        provider: context.$provider,
                        matchedRuleId: null,
                        isFallback: true,
                    });
                    throw new sso_access_denied_error_1.SsoAccessDeniedError();
                }
                return;
            }
            const config = await this.buildRoleMappingConfig();
            const resolved = await this.roleResolverService.resolveRoles({ ...config, projectRoleRules: [] }, context);
            if (resolved.instanceRole.role === api_types_1.BLOCK_ACCESS_ASSIGNMENT) {
                this.logger.warn('SSO login blocked by role mapping', {
                    provider: context.$provider,
                    matchedRuleId: resolved.instanceRole.matchedRuleId,
                    isFallback: resolved.instanceRole.isFallback,
                });
                throw new sso_access_denied_error_1.SsoAccessDeniedError();
            }
            return;
        }
        const config = await this.getConfig();
        if (!config.scopesProvisionInstanceRole)
            return;
        if (config.defaultInstanceRole !== api_types_1.BLOCK_ACCESS_ASSIGNMENT)
            return;
        if (!(await this.isAssignableGlobalRole(instanceRoleClaim))) {
            this.logger.warn('SSO login blocked: no recognised instance role claim', {
                provider: context.$provider,
            });
            throw new sso_access_denied_error_1.SsoAccessDeniedError();
        }
    }
    async isAssignableGlobalRole(roleSlug) {
        if (typeof roleSlug !== 'string' || roleSlug.length === 0)
            return false;
        if (roleSlug === permissions_1.GLOBAL_OWNER_ROLE_SLUG)
            return false;
        const role = await this.roleRepository.findOne({ where: { slug: roleSlug } });
        return role?.roleType === 'global';
    }
    async provisionExpressionMappedRolesForUser(user, context) {
        if (!(await this.isExpressionMappingEnabled()))
            return;
        const previousInstanceRole = user.role.slug;
        const previousProjectRoles = await this.getPreviousProjectRoles(user.id);
        const config = await this.buildRoleMappingConfig();
        const resolved = await this.roleResolverService.resolveRoles(config, context);
        const [instanceRolesManaged, projectRolesManaged] = await Promise.all([
            this.hasRoleMappingRulesOfType('instance'),
            this.hasRoleMappingRulesOfType('project'),
        ]);
        const skipInstanceRole = this.isScimActive();
        const applyInstanceRole = instanceRolesManaged && !skipInstanceRole;
        this.logger.debug('SSO role resolution complete', {
            userId: user.id,
            provider: context.$provider,
            claimKeys: Object.keys(context.$claims ?? {}).sort(),
            matchedInstanceRuleId: resolved.instanceRole.matchedRuleId,
            isFallback: resolved.instanceRole.isFallback,
            matchedProjectRuleIds: [...resolved.projectRoles.values()].map((r) => r.matchedRuleId),
        });
        await this.applyResolvedRoles(user, resolved, {
            instanceRole: applyInstanceRole,
            projectRoles: projectRolesManaged,
        });
        const newInstanceRole = skipInstanceRole
            ? {
                role: previousInstanceRole,
                matchedRuleId: null,
                expression: null,
                isFallback: false,
            }
            : resolved.instanceRole;
        const projectRoles = projectRolesManaged
            ? [...resolved.projectRoles.values()].map((pr) => {
                const prev = previousProjectRoles[pr.projectId] ?? null;
                return { ...pr, previousRole: prev, changed: prev !== pr.role };
            })
            : [];
        const removedProjectIds = projectRolesManaged
            ? Object.keys(previousProjectRoles).filter((id) => !resolved.projectRoles.has(id))
            : [];
        this.eventService.emit('expression-mapping-roles-resolved', {
            userId: user.id,
            userEmail: user.email,
            provider: context.$provider,
            instanceRole: {
                ...newInstanceRole,
                previousRole: previousInstanceRole,
                changed: instanceRolesManaged && newInstanceRole.role !== previousInstanceRole,
            },
            projectRoles,
            removedProjectIds,
        });
    }
};
exports.ProvisioningService = ProvisioningService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-sso-provisioning-configuration'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProvisioningService.prototype, "handleReloadSsoProvisioningConfiguration", null);
exports.ProvisioningService = ProvisioningService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, config_1.GlobalConfig, db_1.SettingsRepository, db_1.ProjectRepository, project_service_ee_1.ProjectService, db_1.RoleRepository, db_1.UserRepository, user_service_1.UserService, backend_common_1.Logger, publisher_service_1.Publisher, n8n_core_1.InstanceSettings, db_1.RoleMappingRuleRepository, role_resolver_service_ee_1.RoleResolverService, role_mapping_rule_service_ee_1.RoleMappingRuleService])
], ProvisioningService);
//# sourceMappingURL=provisioning.service.ee.js.map