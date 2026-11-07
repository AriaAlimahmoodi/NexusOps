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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const tags = ['Promotions'];
let PromotionsPublicController = class PromotionsPublicController {
    constructor(moduleRegistry) {
        this.moduleRegistry = moduleRegistry;
    }
    async createPromotionProvider(_req, _res, input) {
        return await (await this.providersService()).create(input);
    }
    async getPromotionProviders(_req, _res, query) {
        const { offset, limit } = this.resolvePage(query);
        const { data, count } = await (await this.providersService()).list(offset, limit);
        return {
            data,
            nextCursor: limit === 0 ? null : (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async getPromotionProvider(_req, _res, promotionProviderId) {
        return await (await this.providersService()).findOne(promotionProviderId);
    }
    async updatePromotionProvider(_req, _res, promotionProviderId, input) {
        return await (await this.providersService()).update(promotionProviderId, input);
    }
    async deletePromotionProvider(_req, _res, promotionProviderId) {
        await (await this.providersService()).delete(promotionProviderId);
    }
    async getPromotionProviderRepositories(_req, _res, promotionProviderId, query) {
        const { offset, limit } = this.resolveDiscoveryPage(query);
        const { data, hasNextPage } = await (await this.providersService()).listRepositories(promotionProviderId, { offset, limit, search: query.search });
        return {
            data,
            nextCursor: hasNextPage
                ? (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: offset + limit + 1 })
                : null,
        };
    }
    async getPromotionProviderRepositoryBranches(_req, _res, promotionProviderId, repositoryId, query) {
        const { offset, limit } = this.resolveDiscoveryPage(query);
        const { data, hasNextPage } = await (await this.providersService()).listBranches(promotionProviderId, repositoryId, { offset, limit, search: query.search });
        return {
            data,
            nextCursor: hasNextPage
                ? (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: offset + limit + 1 })
                : null,
        };
    }
    async createPromotionConnection(_req, _res, input) {
        return await (await this.connectionsService()).create(input);
    }
    async getPromotionConnections(_req, _res, query) {
        const { offset, limit } = this.resolvePage(query);
        const { data, count } = await (await this.connectionsService()).list(offset, limit, {
            scope: query.scope,
            providerId: query.providerId,
        });
        return {
            data,
            nextCursor: limit === 0 ? null : (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async getPromotionConnection(_req, _res, promotionConnectionId) {
        return await (await this.connectionsService()).findOne(promotionConnectionId);
    }
    async updatePromotionConnection(_req, _res, promotionConnectionId, input) {
        return await (await this.connectionsService()).update(promotionConnectionId, input);
    }
    async deletePromotionConnection(_req, _res, promotionConnectionId) {
        await (await this.connectionsService()).delete(promotionConnectionId);
    }
    async upsertPromotionApplyConfig(_req, _res, promotionConnectionId, input) {
        return await (await this.connectionsService()).upsertConfig(promotionConnectionId, {
            config: { direction: 'apply', settings: input.settings },
            name: input.name,
        });
    }
    async upsertPromotionPromoteConfig(_req, _res, promotionConnectionId, input) {
        return await (await this.connectionsService()).upsertConfig(promotionConnectionId, {
            config: { direction: 'promote', settings: input.settings },
            name: input.name,
        });
    }
    async deletePromotionConfig(_req, _res, promotionConnectionId, direction) {
        await (await this.connectionsService()).deleteConfig(promotionConnectionId, parseDirection(direction));
    }
    async clonePromotionCheckout(_req, _res, promotionConnectionId, direction) {
        return await (await this.promotionsService()).clone(promotionConnectionId, parseDirection(direction));
    }
    async disconnectPromotionCheckout(_req, _res, promotionConnectionId, direction) {
        return await (await this.promotionsService()).disconnect(promotionConnectionId, parseDirection(direction));
    }
    async getPromotionConnectionProjects(_req, _res, promotionConnectionId) {
        return await (await this.connectionsService()).listProjects(promotionConnectionId);
    }
    async addProjectToPromotionConnection(req, _res, promotionConnectionId, projectId) {
        return await (await this.connectionsService()).addProject({
            user: req.user,
            connectionId: promotionConnectionId,
            projectId,
        });
    }
    async removeProjectFromPromotionConnection(req, _res, promotionConnectionId, projectId) {
        await (await this.connectionsService()).removeProject({
            user: req.user,
            connectionId: promotionConnectionId,
            projectId,
        });
    }
    async promotePackage(req, _res, promotionConnectionId, input) {
        return await (await this.promotionsService()).promote(promotionConnectionId, req.user, {
            ...input,
            canExportVariableValues: req.tokenGrant?.apiKeyScopes?.includes('variable:list') ?? false,
        });
    }
    async applyPackage(req, _res, promotionConnectionId, input) {
        return await (await this.promotionsService()).apply(promotionConnectionId, req.user, input.expectedSource);
    }
    async continueApplyPackage(req, _res, promotionConnectionId, input) {
        return await (await this.promotionsService()).continueApply(promotionConnectionId, req.user, input);
    }
    async getPromotionChanges(req, _res, projectId, direction, query) {
        const parsedDirection = parseDirection(direction);
        const requiredScope = parsedDirection === 'apply' ? 'gitConnection:pull' : 'gitConnection:push';
        if (!(req.tokenGrant?.apiKeyScopes?.includes(requiredScope) ?? false)) {
            throw new errors_1.ForbiddenError(`The ${parsedDirection} direction requires the ${requiredScope} scope`);
        }
        return await (await this.changeService()).getChanges(req.user, projectId, parsedDirection, query);
    }
    async promoteProjectSelection(req, _res, projectId, input) {
        return await (await this.promotionsService()).promoteProjectSelection(projectId, req.user, {
            ...input,
            canExportVariableValues: req.tokenGrant?.apiKeyScopes?.includes('variable:list') ?? false,
        });
    }
    async applyProjectSelection(req, _res, projectId, input) {
        return await (await this.promotionsService()).applyProjectSelection(projectId, req.user, input);
    }
    async continueApplyProjectSelection(req, _res, projectId, input) {
        return await (await this.promotionsService()).continueApplyProjectSelection(projectId, req.user, input);
    }
    assertModuleActive() {
        if (!this.moduleRegistry.isActive('promotions')) {
            throw new errors_1.ServiceUnavailableError('Promotions module is not enabled');
        }
    }
    async providersService() {
        this.assertModuleActive();
        const { PromotionProvidersService } = await import('../../../modules/promotions.ee/promotion-providers.service.js');
        return di_1.Container.get(PromotionProvidersService);
    }
    async connectionsService() {
        this.assertModuleActive();
        const { PromotionConnectionsService } = await import('../../../modules/promotions.ee/promotion-connections.service.js');
        return di_1.Container.get(PromotionConnectionsService);
    }
    async promotionsService() {
        this.assertModuleActive();
        const { PromotionsService } = await import('../../../modules/promotions.ee/promotions.service.js');
        return di_1.Container.get(PromotionsService);
    }
    async changeService() {
        this.assertModuleActive();
        const { PromotionChangeService } = await import('../../../modules/promotions.ee/promotion-change.service.js');
        return di_1.Container.get(PromotionChangeService);
    }
    resolvePage(query) {
        const page = (0, pagination_service_1.resolveOffsetPagination)(query);
        if (!query.cursor)
            return page;
        if (!Number.isInteger(page.offset) ||
            page.offset < 0 ||
            !Number.isInteger(page.limit) ||
            page.limit < 1) {
            throw new errors_1.BadRequestError('An invalid cursor was provided');
        }
        return { offset: page.offset, limit: Math.min(page.limit, api_types_1.MAX_ITEMS_PER_PAGE) };
    }
    resolveDiscoveryPage(query) {
        const page = this.resolvePage(query);
        const limit = Math.min(page.limit, api_types_1.MAX_PROMOTION_DISCOVERY_ITEMS_PER_PAGE);
        if (!Number.isSafeInteger(page.offset) ||
            (query.cursor && page.limit > api_types_1.MAX_PROMOTION_DISCOVERY_ITEMS_PER_PAGE) ||
            page.offset % limit !== 0) {
            throw new errors_1.BadRequestError('An invalid cursor was provided');
        }
        return { offset: page.offset, limit };
    }
};
exports.PromotionsPublicController = PromotionsPublicController;
__decorate([
    (0, decorators_1.Post)('/providers'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:create'),
    (0, decorators_1.GlobalScope)('gitConnection:create'),
    (0, decorators_1.ApiSummary)('Create a promotion provider'),
    (0, decorators_1.ApiDescription)('Creates a provider and its authentication material. A Git host provider validates authenticated API access before it saves. For GitLab, the service uses n8n as the Git transport username. Its auth.username is optional. The service ignores any supplied username. Plain Git token authentication requires auth.username. An SSH provider returns the generated public key; add it to the remote as a deploy key.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.PromotionProviderCreatedPublicDto),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreatePromotionProviderDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "createPromotionProvider", null);
__decorate([
    (0, decorators_1.Get)('/providers'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:list'),
    (0, decorators_1.GlobalScope)('gitConnection:list'),
    (0, decorators_1.ApiSummary)('List promotion providers'),
    (0, decorators_1.ApiDescription)('Returns a cursor-paginated list of providers, without their public configuration.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionProviderListPublicDto),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListPromotionProvidersQueryDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionProviders", null);
__decorate([
    (0, decorators_1.Get)('/providers/:promotionProviderId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:read'),
    (0, decorators_1.GlobalScope)('gitConnection:read'),
    (0, decorators_1.ApiSummary)('Retrieve a promotion provider'),
    (0, decorators_1.ApiDescription)('Returns the provider with its public configuration. Secrets are never returned.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionProviderPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionProviderId', api_types_1.promotionProviderIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionProvider", null);
__decorate([
    (0, decorators_1.Put)('/providers/:promotionProviderId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:update'),
    (0, decorators_1.GlobalScope)('gitConnection:update'),
    (0, decorators_1.ApiSummary)('Update a promotion provider'),
    (0, decorators_1.ApiDescription)('Renames the provider, and replaces its credentials when `auth` is sent. A Git host provider can also update its base URL. A different API destination requires `auth` in the same request. Changed credentials and host settings are validated before they save. If another request changes the credentials or configuration before this update saves, the update returns 409. Reload the provider and try again. For GitLab, the service uses n8n as the Git transport username. Its auth.username is optional. The service ignores any supplied username. Plain Git token authentication requires auth.username. New credentials apply to every connection that uses this provider. The authentication method cannot change.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionProviderPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionProviderId', api_types_1.promotionProviderIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdatePromotionProviderDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "updatePromotionProvider", null);
__decorate([
    (0, decorators_1.Delete)('/providers/:promotionProviderId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:delete'),
    (0, decorators_1.GlobalScope)('gitConnection:delete'),
    (0, decorators_1.ApiSummary)('Delete a promotion provider'),
    (0, decorators_1.ApiDescription)('A provider used by a connection cannot be deleted.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionProviderId', api_types_1.promotionProviderIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "deletePromotionProvider", null);
__decorate([
    (0, decorators_1.Get)('/providers/:promotionProviderId/repositories'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:discover'),
    (0, decorators_1.GlobalScope)('gitConnection:discover'),
    (0, decorators_1.ApiSummary)('List repositories of a promotion provider'),
    (0, decorators_1.ApiDescription)('Lists repositories where the GitLab token identity has at least the Developer role. The token also needs Git write scope for promotions. Protected branches can restrict pushes. Use remoteUrl as a connection target. Search matches names and namespaces in similarity order. Unfiltered results use ascending repository ID order. The limit is an upper bound. GitLab returns at most 100 items per page. Follow nextCursor even when a page has fewer items than the requested limit. A saved connection is not required. Invalid credentials return an error, not an empty list. If a response is too large, restart the list with a smaller limit and no cursor.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionRepositoryListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionProviderId', api_types_1.promotionProviderIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ListPromotionRepositoriesQueryDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionProviderRepositories", null);
__decorate([
    (0, decorators_1.Get)('/providers/:promotionProviderId/repositories/:repositoryId/branches'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:discover'),
    (0, decorators_1.GlobalScope)('gitConnection:discover'),
    (0, decorators_1.ApiSummary)('List branches of a promotion repository'),
    (0, decorators_1.ApiDescription)('Lists branches of the selected GitLab repository and identifies its default branch. Pass the URL-encoded fullPath from repository discovery, or the repositoryPath of a saved GitLab connection, as repositoryId. GitLab project IDs are also accepted, but connections do not store them. Supports branch search and cursor pagination. The limit is an upper bound. GitLab returns at most 100 items per page. Follow nextCursor even when a page has fewer items than the requested limit. A saved connection is not required. Invalid credentials and inaccessible repositories return errors, not empty lists. If a response is too large, restart the list with a smaller limit and no cursor.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionBranchListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionProviderId', api_types_1.promotionProviderIdParamSchema)),
    __param(3, (0, decorators_1.Param)('repositoryId', api_types_1.promotionRepositoryIdParamSchema)),
    __param(4, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.ListPromotionBranchesQueryDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionProviderRepositoryBranches", null);
__decorate([
    (0, decorators_1.Post)('/connections'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:create'),
    (0, decorators_1.GlobalScope)('gitConnection:create'),
    (0, decorators_1.ApiSummary)('Create a promotion connection'),
    (0, decorators_1.ApiDescription)('Creates a connection on an existing provider, with up to one initial configuration for each direction. A GitLab target URL must belong to the saved provider. The connection stores only the repository path and derives remoteUrl from the current provider base URL. Plain Git connections keep the full remote URL. Only one instance connection can exist.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.PromotionConnectionPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreatePromotionConnectionDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "createPromotionConnection", null);
__decorate([
    (0, decorators_1.Get)('/connections'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:list'),
    (0, decorators_1.GlobalScope)('gitConnection:list'),
    (0, decorators_1.ApiSummary)('List promotion connections'),
    (0, decorators_1.ApiDescription)('Returns a cursor-paginated list of connections with their configurations. Filter by `scope` for the instance connection, or by `providerId` to see which connections a provider edit affects.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionConnectionListPublicDto),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListPromotionConnectionsQueryDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionConnections", null);
__decorate([
    (0, decorators_1.Get)('/connections/:promotionConnectionId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:read'),
    (0, decorators_1.GlobalScope)('gitConnection:read'),
    (0, decorators_1.ApiSummary)('Retrieve a promotion connection'),
    (0, decorators_1.ApiDescription)('Returns the connection with its provider summary and its configurations.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionConnectionPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionConnection", null);
__decorate([
    (0, decorators_1.Put)('/connections/:promotionConnectionId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:update'),
    (0, decorators_1.GlobalScope)('gitConnection:update'),
    (0, decorators_1.ApiSummary)('Update a promotion connection'),
    (0, decorators_1.ApiDescription)('Updates the name, target, or provider. A target replaces the whole saved target. GitLab connections store a repository path and derive remoteUrl from the provider. Plain Git connections keep the full remote URL. If the provider changes during a target or provider update, the update returns 409. Reload the connection and try again. Scope cannot change, and configurations have their own routes.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionConnectionPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdatePromotionConnectionDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "updatePromotionConnection", null);
__decorate([
    (0, decorators_1.Delete)('/connections/:promotionConnectionId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:delete'),
    (0, decorators_1.GlobalScope)('gitConnection:delete'),
    (0, decorators_1.ApiSummary)('Delete a promotion connection'),
    (0, decorators_1.ApiDescription)('Deletes the connection with its configurations, project links, and local checkouts. Its provider is kept.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "deletePromotionConnection", null);
__decorate([
    (0, decorators_1.Put)('/connections/:promotionConnectionId/configs/apply'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:update'),
    (0, decorators_1.GlobalScope)('gitConnection:update'),
    (0, decorators_1.ApiSummary)('Create or replace the Apply configuration'),
    (0, decorators_1.ApiDescription)('Replaces the whole configuration, so an omitted name resets it to "Apply". Answers 200 whether it created or replaced.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionApplyConfigPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpsertPromotionApplyConfigDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "upsertPromotionApplyConfig", null);
__decorate([
    (0, decorators_1.Put)('/connections/:promotionConnectionId/configs/promote'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:update'),
    (0, decorators_1.GlobalScope)('gitConnection:update'),
    (0, decorators_1.ApiSummary)('Create or replace the Promote configuration'),
    (0, decorators_1.ApiDescription)('Replaces the whole configuration, so an omitted name resets it to "Promote" and `createBranchOnPromotion` is always required. Answers 200 whether it created or replaced.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionPromoteConfigPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpsertPromotionPromoteConfigDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "upsertPromotionPromoteConfig", null);
__decorate([
    (0, decorators_1.Delete)('/connections/:promotionConnectionId/configs/:direction'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:update'),
    (0, decorators_1.GlobalScope)('gitConnection:update'),
    (0, decorators_1.ApiSummary)('Remove one direction'),
    (0, decorators_1.ApiDescription)('Deletes the configuration and its local checkout. Nothing in Git changes.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, (0, decorators_1.Param)('direction', api_types_1.promotionDirectionParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "deletePromotionConfig", null);
__decorate([
    (0, decorators_1.Post)('/connections/:promotionConnectionId/:direction/clone'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:clone'),
    (0, decorators_1.GlobalScope)('gitConnection:clone'),
    (0, decorators_1.ApiSummary)("Clone one direction's repository"),
    (0, decorators_1.ApiDescription)('Clones the configured branch into local storage on the instance that handles the request. Safe to call repeatedly. Cloning one direction does not make the other ready.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionCheckoutPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, (0, decorators_1.Param)('direction', api_types_1.promotionDirectionParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "clonePromotionCheckout", null);
__decorate([
    (0, decorators_1.Post)('/connections/:promotionConnectionId/:direction/disconnect'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:clone'),
    (0, decorators_1.GlobalScope)('gitConnection:clone'),
    (0, decorators_1.ApiSummary)("Remove one direction's local checkout"),
    (0, decorators_1.ApiDescription)('Removes the local checkout and keeps the configuration, its credentials, and the trusted SSH host keys.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionCheckoutPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, (0, decorators_1.Param)('direction', api_types_1.promotionDirectionParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "disconnectPromotionCheckout", null);
__decorate([
    (0, decorators_1.Get)('/connections/:promotionConnectionId/projects'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:read'),
    (0, decorators_1.GlobalScope)('gitConnection:read'),
    (0, decorators_1.ApiSummary)('List projects linked to a promotion connection'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionConnectionProjectListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionConnectionProjects", null);
__decorate([
    (0, decorators_1.Post)('/connections/:promotionConnectionId/projects/:projectId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:manageProjects'),
    (0, decorators_1.GlobalScope)('gitConnection:manageProjects'),
    (0, decorators_1.ApiSummary)('Link a project to a promotion connection'),
    (0, decorators_1.ApiDescription)('Links a team project to a project-scoped connection. A project can be linked to only one connection.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionConnectionProjectPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(403),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "addProjectToPromotionConnection", null);
__decorate([
    (0, decorators_1.Delete)('/connections/:promotionConnectionId/projects/:projectId'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:manageProjects'),
    (0, decorators_1.GlobalScope)('gitConnection:manageProjects'),
    (0, decorators_1.ApiSummary)('Unlink a project from a promotion connection'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(403),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "removeProjectFromPromotionConnection", null);
__decorate([
    (0, decorators_1.Post)('/connections/:promotionConnectionId/promote'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:push'),
    (0, decorators_1.GlobalScope)('gitConnection:push'),
    (0, decorators_1.ApiSummary)('Promote all team projects'),
    (0, decorators_1.ApiDescription)('Exports every team project, commits it, and pushes to the configured base branch or a new timestamped branch. The response reports the target branch in `git.branchName`. Personal projects are ignored. Requires the Promote direction to be cloned first, and is available on the instance connection only. The API key also needs variable:list when the workflows reference variables.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotePackageResultDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.PromotePackageDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "promotePackage", null);
__decorate([
    (0, decorators_1.Post)('/connections/:promotionConnectionId/apply'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:pull'),
    (0, decorators_1.GlobalScope)('gitConnection:pull'),
    (0, decorators_1.ApiSummary)('Apply a package to the instance'),
    (0, decorators_1.ApiDescription)('Checks the full package at the configured branch tip. Optionally send expectedSource with the configId, branchName, and full commitSha from the reviewed change preview; status `source-changed` means the branch moved since that review and nothing was imported. Returns status `blocked` before import writes if bindings need setup or if the apply would delete team projects that the package does not hold. Retain configId and git for Continue. Status `applied` includes counts and warnings. Inspect status before reading counts. Existing target variable values, including empty strings, are preserved. Requires a cloned Apply direction on an instance connection. The API key needs the gitConnection:pull scope. The importer checks user write permissions; granular API-key write scopes are not passed to it.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.ApplyPackageResultDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(422),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ApplyPackageDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "applyPackage", null);
__decorate([
    (0, decorators_1.Post)('/connections/:promotionConnectionId/apply/continue'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:pull'),
    (0, decorators_1.GlobalScope)('gitConnection:pull'),
    (0, decorators_1.ApiSummary)('Continue Apply after binding setup'),
    (0, decorators_1.ApiDescription)('Rechecks the configured source and current target bindings. Send expectedSource with the configId, branchName, and full commitSha from the reviewed Apply result. Send `confirmDestructiveChanges: true` to also apply destructive data table changes and delete the reported team projects. Status `source-changed` requires a new Apply review. Status `blocked` returns fresh binding details without import writes. Status `applied` includes counts and warnings. Inspect status before reading counts. Existing target variable values are preserved. Requires the same cloned instance connection and permissions as Apply. The importer checks user write permissions; granular API-key write scopes are not passed to it. No server session or exactly-once guarantee is provided.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.ApplyPackageResultDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(422),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('promotionConnectionId', api_types_1.promotionConnectionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ContinueApplyPackageDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "continueApplyPackage", null);
__decorate([
    (0, decorators_1.Get)('/projects/:projectId/changes/:direction'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)({ anyOf: ['gitConnection:push', 'gitConnection:pull'] }),
    (0, decorators_1.ApiSummary)('List the changes of a project in one direction'),
    (0, decorators_1.ApiDescription)('Compares a team project on this instance with the branch of its promotion configuration and lists the workflows that differ. For `promote` the rows are what a promotion sends to the branch, and the key needs the gitConnection:push scope. For `apply` the rows are what applying the branch changes on this instance, and the key needs the gitConnection:pull scope. `commitSha` is the commit the rows were read from. Requires the direction to be cloned first.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotionChangesDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, (0, decorators_1.Param)('direction', api_types_1.promotionDirectionParamSchema)),
    __param(4, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.PromotionChangesQueryDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "getPromotionChanges", null);
__decorate([
    (0, decorators_1.Post)('/projects/:projectId/promote'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:push'),
    (0, decorators_1.GlobalScope)('gitConnection:push'),
    (0, decorators_1.ApiSummary)("Promote a selection of a project's workflows"),
    (0, decorators_1.ApiDescription)("Promotes a chosen set of a team project's workflows to the Promote branch of the project's promotion configuration. Send workflow ids only; the server reads each one now, so the push carries the current state. Live and archived workflows the project owns are exported, so an archived id stays on the branch as archived; an id the project no longer owns (its workflow is gone, or moved to another project) leaves the branch, matching the project's change list. A deletion the branch does not hold under this project rejects the whole request before any write. Requires the Promote direction to be cloned first, and a promotion connection to resolve for the project (its own connection, otherwise the instance connection). The API key also needs variable:list when the workflows reference variables."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.PromotePackageResultDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.PromoteSelectionRequestDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "promoteProjectSelection", null);
__decorate([
    (0, decorators_1.Post)('/projects/:projectId/apply'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:pull'),
    (0, decorators_1.GlobalScope)('gitConnection:pull'),
    (0, decorators_1.ApiSummary)("Apply a selection of a project's workflows"),
    (0, decorators_1.ApiDescription)("Applies selected workflow changes from the project's Apply branch. Send the selected change-list IDs in workflowIds. The server imports IDs present on the branch for this project. It removes instance workflows owned by this project when their IDs are absent from the branch. Duplicate or invalid IDs reject the whole request. Unselected content stays unchanged. Optionally send expectedSource with the configId, branchName, and full commitSha from the reviewed change preview. Status `source-changed` means the source changed since that review and nothing was imported. Status `blocked` returns binding details before import writes when the selection needs binding setup. Retain configId and git for Continue. Status `applied` includes counts and warnings. Inspect status before reading counts. Requires a cloned Apply direction for the project's resolved promotion connection. The API key needs the gitConnection:pull scope. The importer checks user write permissions."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.ApplyPackageResultDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(422),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ApplySelectionDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "applyProjectSelection", null);
__decorate([
    (0, decorators_1.Post)('/projects/:projectId/apply/continue'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    (0, decorators_1.ApiKeyScope)('gitConnection:pull'),
    (0, decorators_1.GlobalScope)('gitConnection:pull'),
    (0, decorators_1.ApiSummary)('Continue applying a selection after binding setup'),
    (0, decorators_1.ApiDescription)("Rechecks the project's Apply source and the current bindings for the selection. Resend the full selection in workflowIds. Send the required expectedSource with the configId, branchName, and full commitSha from the reviewed Apply result. Send `confirmDestructiveChanges: true` to also apply destructive data table changes. The server does not keep a session. Status `source-changed` requires a new Apply review. Status `blocked` returns fresh binding details before import writes. Status `applied` includes counts and warnings. Inspect status before reading counts. Unselected content stays unchanged. Requires the same cloned Apply direction and permissions as the initial selection apply. The API key needs the gitConnection:pull scope. The importer checks user write permissions."),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.ApplyPackageResultDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    (0, decorators_1.ApiErrorResponse)(422),
    (0, decorators_1.ApiErrorResponse)(503),
    __param(2, (0, decorators_1.Param)('projectId', api_types_1.projectIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.ContinueApplySelectionDto]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "continueApplyProjectSelection", null);
exports.PromotionsPublicController = PromotionsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/promotions'),
    __metadata("design:paramtypes", [backend_common_1.ModuleRegistry])
], PromotionsPublicController);
function parseDirection(value) {
    const parsed = api_types_1.promotionDirectionSchema.safeParse(value);
    if (!parsed.success)
        throw new errors_1.NotFoundError(`Unknown promotion direction: ${value}`);
    return parsed.data;
}
//# sourceMappingURL=promotions.public.controller.js.map