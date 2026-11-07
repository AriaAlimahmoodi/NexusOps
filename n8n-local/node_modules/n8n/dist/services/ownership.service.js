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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const config_1 = __importDefault(require("../config"));
const errors_1 = require("@n8n/errors");
const password_utility_1 = require("./password.utility");
let OwnershipService = class OwnershipService {
    constructor(cacheService, eventService, logger, passwordUtility, projectRelationRepository, projectRepository, workflowProjectService, userRepository, settingsRepository) {
        this.cacheService = cacheService;
        this.eventService = eventService;
        this.logger = logger;
        this.passwordUtility = passwordUtility;
        this.projectRelationRepository = projectRelationRepository;
        this.projectRepository = projectRepository;
        this.workflowProjectService = workflowProjectService;
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
    }
    copyProject(project) {
        return {
            ...project,
        };
    }
    reconstructProject(project) {
        if (typeof project?.id !== 'string') {
            return undefined;
        }
        return Object.assign(new db_1.Project(), project);
    }
    copyUser(user) {
        return {
            ...user,
            role: { ...user.role, scopes: [...user.role.scopes] },
        };
    }
    reconstructUser(cachedUser) {
        if (typeof cachedUser !== 'object' || cachedUser === null) {
            return undefined;
        }
        const user = Object.assign(new db_1.User(), cachedUser);
        if ('role' in cachedUser && cachedUser.role && typeof cachedUser.role === 'object') {
            user.role = Object.assign(new db_1.Role(), cachedUser.role);
            if ('scopes' in cachedUser.role && Array.isArray(cachedUser.role.scopes)) {
                user.role.scopes = cachedUser.role.scopes.map((scope) => {
                    const x = Object.assign(new db_1.Scope(), scope);
                    return x;
                });
            }
            return user;
        }
        return undefined;
    }
    async getWorkflowProjectCached(workflowId) {
        return await this.workflowProjectService.getWorkflowProjectCached(workflowId);
    }
    async setWorkflowProjectCacheEntry(workflowId, project) {
        return await this.workflowProjectService.setWorkflowProjectCacheEntry(workflowId, project);
    }
    async getPersonalProjectOwnerCached(projectId) {
        const owners = await this.getPersonalProjectOwnersCached([projectId]);
        return owners.get(projectId) ?? null;
    }
    async getPersonalProjectOwnersCached(projectIds) {
        const ownerByProjectId = new Map();
        const cacheResults = await Promise.all([...new Set(projectIds)].map(async (projectId) => {
            const cachedValue = await this.cacheService.getHashValue('project-owner', projectId);
            return {
                projectId,
                owner: cachedValue ? this.reconstructUser(cachedValue) : undefined,
            };
        }));
        for (const { projectId, owner } of cacheResults) {
            if (owner)
                ownerByProjectId.set(projectId, owner);
        }
        const projectIdsToFetch = cacheResults
            .filter(({ owner }) => !owner)
            .map(({ projectId }) => projectId);
        if (projectIdsToFetch.length === 0)
            return ownerByProjectId;
        const ownerRelations = await this.projectRelationRepository.getPersonalProjectOwners(projectIdsToFetch);
        const ownersToCache = {};
        for (const { projectId, user } of ownerRelations) {
            ownerByProjectId.set(projectId, user);
            ownersToCache[projectId] = this.copyUser(user);
        }
        void this.cacheService.setHash('project-owner', ownersToCache);
        return ownerByProjectId;
    }
    async invalidateProjectOwnerCacheByUserId(userId) {
        const personalProject = await this.projectRepository.getPersonalProjectForUser(userId);
        if (personalProject) {
            await this.cacheService.deleteFromHash('project-owner', personalProject.id);
        }
    }
    async invalidateWorkflowProjectCacheForProject(projectId) {
        await this.workflowProjectService.invalidateWorkflowProjectCacheForProject(projectId);
    }
    async invalidateWorkflowProjectCacheByIds(workflowIds) {
        await this.workflowProjectService.invalidateWorkflowProjectCacheByIds(workflowIds);
    }
    addOwnedByAndSharedWith(rawEntity) {
        const shared = rawEntity.shared;
        const entity = rawEntity;
        Object.assign(entity, {
            homeProject: null,
            sharedWithProjects: [],
        });
        if (shared === undefined) {
            return entity;
        }
        for (const sharedEntity of shared) {
            const { project, role } = sharedEntity;
            if (role === 'credential:owner' || role === 'workflow:owner') {
                entity.homeProject = {
                    id: project.id,
                    type: project.type,
                    name: project.name,
                    icon: project.icon,
                };
            }
            else {
                entity.sharedWithProjects.push({
                    id: project.id,
                    type: project.type,
                    name: project.name,
                    icon: project.icon,
                });
            }
        }
        return entity;
    }
    async getInstanceOwner() {
        return await this.userRepository.findOneOrFail({
            where: { role: { slug: db_1.GLOBAL_OWNER_ROLE.slug } },
            relations: ['role'],
        });
    }
    async hasInstanceOwner() {
        return await this.userRepository.hasClaimedInstanceOwner();
    }
    async setupOwner(payload, options) {
        const { email, firstName, lastName, password } = payload;
        if (!options?.overwriteExisting && (await this.hasInstanceOwner())) {
            this.logger.debug('Request to claim instance ownership failed because instance owner already exists');
            throw new errors_1.BadRequestError('Instance owner already setup');
        }
        let shellUser = await this.userRepository.findOne({
            where: { role: { slug: db_1.GLOBAL_OWNER_ROLE.slug } },
            relations: ['role'],
        });
        if (!shellUser) {
            this.logger.error('Could not find shell user with global:owner role');
            throw new errors_1.BadRequestError('Instance owner shell user not found');
        }
        shellUser.email = email.toLowerCase();
        shellUser.firstName = firstName;
        shellUser.lastName = lastName;
        shellUser.lastActiveAt = new Date();
        shellUser.password = options?.passwordIsHashed
            ? password
            : await this.passwordUtility.hash(password);
        shellUser = await this.userRepository.save(shellUser, { transaction: false });
        this.logger.info('Owner was set up successfully');
        this.eventService.emit('instance-owner-setup', { userId: shellUser.id });
        await this.settingsRepository.update({ key: 'userManagement.isInstanceOwnerSetUp' }, { value: JSON.stringify(true) });
        config_1.default.set('userManagement.isInstanceOwnerSetUp', true);
        return shellUser;
    }
};
exports.OwnershipService = OwnershipService;
exports.OwnershipService = OwnershipService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CacheService, backend_services_1.EventService, backend_common_1.Logger, password_utility_1.PasswordUtility, db_1.ProjectRelationRepository, db_1.ProjectRepository, backend_services_1.WorkflowProjectService, db_1.UserRepository, db_1.SettingsRepository])
], OwnershipService);
//# sourceMappingURL=ownership.service.js.map