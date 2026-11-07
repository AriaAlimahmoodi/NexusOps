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
exports.PromotionConfigResolver = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const promotion_config_repository_1 = require("./database/repositories/promotion-config.repository");
const promotion_connection_project_repository_1 = require("./database/repositories/promotion-connection-project.repository");
const promotion_connection_repository_1 = require("./database/repositories/promotion-connection.repository");
const git_host_target_1 = require("./git-hosts/git-host-target");
const promotion_config_settings_1 = require("./promotion-config-settings");
let PromotionConfigResolver = class PromotionConfigResolver {
    constructor(configRepository, connectionRepository, linkRepository, projectRepository) {
        this.configRepository = configRepository;
        this.connectionRepository = connectionRepository;
        this.linkRepository = linkRepository;
        this.projectRepository = projectRepository;
    }
    async resolveForConnection(connectionId, direction) {
        const config = await this.configRepository.findResolved(connectionId, direction);
        if (!config) {
            const connection = await this.connectionRepository.findByIdWithProvider(connectionId);
            if (!connection)
                throw new errors_1.NotFoundError('Promotion connection not found');
            throw new errors_1.NotFoundError(`This connection has no ${direction} configuration`);
        }
        return this.toOperationInput(config);
    }
    async resolveForProject(projectId, direction) {
        const project = await this.projectRepository.findOneBy({ id: projectId });
        if (!project)
            throw new errors_1.NotFoundError('Project not found');
        if (project.type !== 'team') {
            throw new errors_1.BadRequestError('Only team projects can use a promotion connection');
        }
        const link = await this.linkRepository.findByProjectId(projectId);
        if (link) {
            const config = await this.configRepository.findResolved(link.connectionId, direction);
            if (!config) {
                throw new errors_1.BadRequestError(`The promotion connection for this project has no ${direction} configuration`);
            }
            return this.toOperationInput(config);
        }
        const instance = await this.connectionRepository.findInstanceConnection();
        if (!instance) {
            throw new errors_1.NotFoundError('No promotion connection is configured for this instance');
        }
        const config = await this.configRepository.findResolved(instance.id, direction);
        if (!config) {
            throw new errors_1.BadRequestError(`The instance promotion connection has no ${direction} configuration`);
        }
        return this.toOperationInput(config);
    }
    toOperationInput(config) {
        const { connection } = config;
        const { provider } = connection;
        const providerType = api_types_1.promotionProviderTypeSchema.safeParse(provider.type);
        if (!providerType.success) {
            throw new errors_1.BadRequestError('The stored provider type is not supported');
        }
        const target = (0, git_host_target_1.resolvePromotionGitTarget)(provider, connection.target);
        const resolved = (0, promotion_config_settings_1.resolveStoredConfig)(config);
        if (!resolved) {
            throw new errors_1.BadRequestError('The stored promotion configuration cannot be read');
        }
        return Object.freeze({
            connectionId: connection.id,
            connectionScope: connection.scope,
            configId: config.id,
            providerId: provider.id,
            providerType: providerType.data,
            authType: provider.authType,
            encryptedAuth: provider.auth,
            target,
            config: resolved,
        });
    }
};
exports.PromotionConfigResolver = PromotionConfigResolver;
exports.PromotionConfigResolver = PromotionConfigResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [promotion_config_repository_1.PromotionConfigRepository, promotion_connection_repository_1.PromotionConnectionRepository, promotion_connection_project_repository_1.PromotionConnectionProjectRepository, db_1.ProjectRepository])
], PromotionConfigResolver);
//# sourceMappingURL=promotion-config.resolver.js.map