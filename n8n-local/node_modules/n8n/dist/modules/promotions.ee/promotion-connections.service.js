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
exports.PromotionConnectionsService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const check_access_1 = require("../../permissions.ee/check-access");
const constants_1 = require("./constants");
const promotion_config_repository_1 = require("./database/repositories/promotion-config.repository");
const promotion_connection_project_repository_1 = require("./database/repositories/promotion-connection-project.repository");
const promotion_connection_repository_1 = require("./database/repositories/promotion-connection.repository");
const promotion_config_settings_1 = require("./promotion-config-settings");
const git_host_target_1 = require("./git-hosts/git-host-target");
const promotion_conflicts_1 = require("./promotion-conflicts");
const promotion_providers_service_1 = require("./promotion-providers.service");
const promotion_working_directory_service_1 = require("./promotion-working-directory.service");
const promotions_git_service_1 = require("./promotions-git.service");
const promotions_git_utils_1 = require("./promotions-git.utils");
let PromotionConnectionsService = class PromotionConnectionsService {
    constructor(connectionRepository, configRepository, linkRepository, projectRepository, providersService, gitService, workingDirectory, txRunner, logger) {
        this.connectionRepository = connectionRepository;
        this.configRepository = configRepository;
        this.linkRepository = linkRepository;
        this.projectRepository = projectRepository;
        this.providersService = providersService;
        this.gitService = gitService;
        this.workingDirectory = workingDirectory;
        this.txRunner = txRunner;
        this.logger = logger;
        this.logger = this.logger.scoped('promotions');
    }
    async create(input) {
        const provider = await this.providersService.getEntity(input.providerId);
        this.gitService.validateRemoteUrl(input.target.remoteUrl, provider.authType);
        const target = (0, git_host_target_1.storePromotionTarget)(provider, input.target);
        const writes = requestedConfigWrites(input.configs);
        for (const { config } of writes) {
            await this.gitService.validateBranchName((0, promotions_git_utils_1.checkoutBranchName)(config));
        }
        const created = await (0, promotion_conflicts_1.mapPromotionConflicts)(async () => await this.txRunner.run({}, async (ctx) => {
            const connection = await this.connectionRepository.insertConnection({
                name: input.name,
                scope: input.scope,
                providerId: input.providerId,
                target,
            }, ctx);
            const configs = [];
            for (const write of writes) {
                configs.push(await this.insertConfig(connection.id, write, ctx));
            }
            return { connection, configs };
        }));
        return await this.toPublic({ ...created.connection, provider }, created.configs);
    }
    async findOne(id) {
        const connection = await this.getEntity(id);
        const configs = await this.configRepository.findByConnectionIds([id]);
        return await this.toPublic(connection, configs);
    }
    async list(offset, limit, filter) {
        const { data, count } = await this.connectionRepository.listConnections({
            offset,
            limit,
            filter,
        });
        const configs = await this.configRepository.findByConnectionIds(data.map(({ id }) => id));
        return {
            count,
            data: data.map((connection) => this.toSummary(connection, configs.filter((config) => config.connectionId === connection.id))),
        };
    }
    async update(id, input) {
        if (Object.keys(input).length === 0) {
            throw new errors_1.BadRequestError('At least one field is required');
        }
        const current = await this.getEntity(id);
        const provider = input.providerId
            ? await this.providersService.getEntity(input.providerId)
            : current.provider;
        const requested = input.target ?? (0, git_host_target_1.resolvePromotionTarget)(current.provider, current.target);
        this.gitService.validateRemoteUrl(requested.remoteUrl, provider.authType);
        const changesTarget = input.target !== undefined || provider.id !== current.providerId;
        const target = input.target === undefined &&
            (0, api_types_1.isPromotionGitHostType)(provider.type) &&
            'repositoryPath' in current.target
            ? current.target
            : changesTarget
                ? (0, git_host_target_1.storePromotionTarget)(provider, requested)
                : current.target;
        if (input.target !== undefined || input.providerId !== undefined) {
            const updated = await this.connectionRepository.updateConnection(id, current.providerId, {
                ...(input.name !== undefined && { name: input.name }),
                ...(changesTarget && { target }),
                ...(input.providerId !== undefined && { providerId: input.providerId }),
            });
            if (!updated) {
                throw new errors_1.ConflictError('The connection changed during the update. Reload it and try again.');
            }
        }
        else if (input.name !== undefined) {
            await this.connectionRepository.renameConnection(id, input.name);
        }
        return await this.findOne(id);
    }
    async delete(id) {
        await this.getEntity(id);
        const configs = await this.configRepository.findByConnectionIds([id]);
        await this.connectionRepository.deleteConnection(id);
        for (const config of configs)
            await this.purgeCache(config.id);
    }
    async upsertConfig(connectionId, write) {
        const connection = await this.getEntity(connectionId);
        await this.gitService.validateBranchName((0, promotions_git_utils_1.checkoutBranchName)(write.config));
        const { direction } = write.config;
        const existing = await this.configRepository.findByConnectionAndDirection(connectionId, direction);
        const stored = existing
            ? await this.replaceConfig(existing.id, write)
            : await (0, promotion_conflicts_1.mapPromotionConflicts)(async () => await this.insertConfig(connectionId, write));
        return await this.toConfigPublic(connection, stored);
    }
    async deleteConfig(connectionId, direction) {
        await this.getEntity(connectionId);
        const config = await this.configRepository.findByConnectionAndDirection(connectionId, direction);
        if (!config)
            throw new errors_1.NotFoundError('Promotion configuration not found');
        await this.configRepository.deleteConfig(config.id);
        await this.purgeCache(config.id);
    }
    async listProjects(id) {
        await this.getEntity(id);
        return { projectIds: await this.linkRepository.findProjectIdsByConnection(id) };
    }
    async addProject({ user, connectionId, projectId, }) {
        const connection = await this.getEntity(connectionId);
        this.assertLinkableScope(connection.scope);
        await this.assertProjectAccess(user, projectId);
        await this.assertProjectIsTeam(projectId);
        const link = await (0, promotion_conflicts_1.mapPromotionConflicts)(async () => await this.linkRepository.linkProject(projectId, connectionId));
        return { projectId: link.projectId, connectionId: link.connectionId };
    }
    async removeProject({ user, connectionId, projectId }) {
        await this.getEntity(connectionId);
        await this.assertProjectAccess(user, projectId);
        const existing = await this.linkRepository.findByProjectId(projectId);
        if (!existing)
            return;
        if (existing.connectionId !== connectionId)
            throw this.linkedElsewhere();
        const removed = await this.linkRepository.unlinkProject(projectId, connectionId);
        if (removed > 0)
            return;
        const current = await this.linkRepository.findByProjectId(projectId);
        if (current && current.connectionId !== connectionId)
            throw this.linkedElsewhere();
    }
    async getEntity(id) {
        const connection = await this.connectionRepository.findByIdWithProvider(id);
        if (!connection)
            throw new errors_1.NotFoundError('Promotion connection not found');
        return connection;
    }
    async toPublic(connection, configs) {
        return {
            ...this.connectionFields(connection),
            configs: await this.toConfigsPublic(connection, configs),
        };
    }
    toSummary(connection, configs) {
        return {
            ...this.connectionFields(connection),
            configs: this.toConfigsSummary(configs),
        };
    }
    connectionFields(connection) {
        return {
            id: connection.id,
            name: connection.name,
            scope: connection.scope,
            target: {
                ...(0, git_host_target_1.resolvePromotionTarget)(connection.provider, connection.target),
                ...('repositoryPath' in connection.target && {
                    repositoryPath: connection.target.repositoryPath,
                }),
            },
            provider: this.providersService.toSummary(connection.provider),
            createdAt: connection.createdAt.toISOString(),
            updatedAt: connection.updatedAt.toISOString(),
        };
    }
    async toConfigsPublic(connection, configs) {
        const byDirection = {};
        for (const config of configs) {
            const resolved = (0, promotion_config_settings_1.resolveStoredConfig)(config);
            if (!resolved)
                continue;
            const fields = await this.configFields(connection, config, resolved);
            if (resolved.direction === 'apply') {
                byDirection.apply = { ...fields, settings: resolved.settings };
            }
            else {
                byDirection.promote = { ...fields, settings: resolved.settings };
            }
        }
        return byDirection;
    }
    toConfigsSummary(configs) {
        const byDirection = {};
        for (const config of configs) {
            const resolved = (0, promotion_config_settings_1.resolveStoredConfig)(config);
            if (!resolved)
                continue;
            const fields = this.configSummaryFields(config);
            if (resolved.direction === 'apply') {
                byDirection.apply = { ...fields, settings: resolved.settings };
            }
            else {
                byDirection.promote = { ...fields, settings: resolved.settings };
            }
        }
        return byDirection;
    }
    async toConfigPublic(connection, config) {
        const resolved = (0, promotion_config_settings_1.resolveStoredConfig)(config);
        if (!resolved) {
            throw new errors_1.BadRequestError('The stored promotion configuration cannot be read');
        }
        const fields = await this.configFields(connection, config, resolved);
        return resolved.direction === 'apply'
            ? { ...fields, settings: resolved.settings }
            : { ...fields, settings: resolved.settings };
    }
    async configFields(connection, config, resolved) {
        return {
            ...this.configSummaryFields(config),
            checkout: await this.checkoutStateFor(connection, config, resolved),
        };
    }
    configSummaryFields(config) {
        return {
            id: config.id,
            name: config.name,
            createdAt: config.createdAt.toISOString(),
            updatedAt: config.updatedAt.toISOString(),
        };
    }
    async checkoutStateFor(connection, config, resolved) {
        const { repositoryFolder } = this.workingDirectory.paths(config.id);
        const hasCheckout = await this.gitService.hasCheckout(repositoryFolder);
        if (!hasCheckout)
            return { hasCheckout: false, matchesConfig: false };
        let target;
        try {
            target = (0, git_host_target_1.resolvePromotionGitTarget)(connection.provider, connection.target);
        }
        catch {
            return { hasCheckout, matchesConfig: false };
        }
        const matchesConfig = await this.workingDirectory.matchesDescriptor((0, promotions_git_utils_1.buildCacheDescriptor)({
            connectionId: connection.id,
            configId: config.id,
            target,
            config: resolved,
        }));
        return { hasCheckout, matchesConfig };
    }
    async insertConfig(connectionId, { config, name }, ctx = {}) {
        return await this.configRepository.insertConfig({
            connectionId,
            direction: config.direction,
            name: name ?? constants_1.DIRECTION_LABELS[config.direction],
            settings: config.settings,
        }, ctx);
    }
    async replaceConfig(id, { config, name }) {
        await this.configRepository.replaceConfig(id, {
            name: name ?? constants_1.DIRECTION_LABELS[config.direction],
            settings: config.settings,
        });
        const stored = await this.configRepository.findById(id);
        if (!stored)
            throw new errors_1.NotFoundError('Promotion configuration not found');
        return stored;
    }
    assertLinkableScope(scope) {
        if (scope !== 'projects') {
            throw new errors_1.BadRequestError('Only a project-scoped connection can have project links');
        }
    }
    async assertProjectAccess(user, projectId) {
        const allowed = await (0, check_access_1.userHasScopes)(user, ['project:update'], false, { projectId });
        if (!allowed)
            throw new errors_1.ForbiddenError('You do not have access to this project');
    }
    async assertProjectIsTeam(projectId) {
        const project = await this.projectRepository.findOneBy({ id: projectId });
        if (!project)
            throw new errors_1.NotFoundError('Project not found');
        if (project.type !== 'team') {
            throw new errors_1.BadRequestError('Only team projects can be linked to a promotion connection');
        }
    }
    linkedElsewhere() {
        return new errors_1.ConflictError('This project is linked to another promotion connection');
    }
    async purgeCache(configId) {
        try {
            await this.workingDirectory.purge(configId);
        }
        catch (error) {
            this.logger.warn('Failed to remove the local promotion checkout', {
                configId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.PromotionConnectionsService = PromotionConnectionsService;
exports.PromotionConnectionsService = PromotionConnectionsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [promotion_connection_repository_1.PromotionConnectionRepository, promotion_config_repository_1.PromotionConfigRepository, promotion_connection_project_repository_1.PromotionConnectionProjectRepository, db_1.ProjectRepository, promotion_providers_service_1.PromotionProvidersService, promotions_git_service_1.PromotionsGitService, promotion_working_directory_service_1.PromotionWorkingDirectoryService, db_1.TransactionRunner, backend_common_1.Logger])
], PromotionConnectionsService);
function requestedConfigWrites(configs) {
    const writes = [];
    if (configs?.apply) {
        writes.push({
            config: { direction: 'apply', settings: configs.apply.settings },
            name: configs.apply.name,
        });
    }
    if (configs?.promote) {
        writes.push({
            config: { direction: 'promote', settings: configs.promote.settings },
            name: configs.promote.name,
        });
    }
    return writes;
}
//# sourceMappingURL=promotion-connections.service.js.map