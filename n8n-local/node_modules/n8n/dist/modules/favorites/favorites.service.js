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
exports.FavoritesService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const errors_1 = require("@n8n/errors");
const user_favorite_repository_1 = require("./database/repositories/user-favorite.repository");
const idsOfType = (favorites, type) => favorites.filter((f) => f.resourceType === type).map((f) => f.resourceId);
const enrichWithName = (fav, name) => name === undefined ? [] : [{ ...fav, resourceName: name }];
const enrichWithMeta = (fav, meta) => meta === undefined
    ? []
    : [{ ...fav, resourceName: meta.name, resourceProjectId: meta.projectId }];
let FavoritesService = class FavoritesService {
    constructor(userFavoriteRepository, workflowRepository, projectRepository, sharedWorkflowRepository, folderRepository, resourceResolvers) {
        this.userFavoriteRepository = userFavoriteRepository;
        this.workflowRepository = workflowRepository;
        this.projectRepository = projectRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.folderRepository = folderRepository;
        this.resourceResolvers = resourceResolvers;
        this.MAX_FAVORITES = 200;
    }
    async getEnrichedFavorites(user) {
        const favorites = await this.userFavoriteRepository.findByUser(user.id);
        if (favorites.length === 0)
            return [];
        const ids = {
            workflow: idsOfType(favorites, 'workflow'),
            project: idsOfType(favorites, 'project'),
            dataTable: idsOfType(favorites, 'dataTable'),
            folder: idsOfType(favorites, 'folder'),
            agent: idsOfType(favorites, 'agent'),
        };
        const accessibleProjects = await this.projectRepository.getAccessibleProjects(user.id);
        const accessibleProjectIds = new Set(accessibleProjects.map((p) => p.id));
        const [workflowNames, projectNames, dataTableMeta, folderMeta, agentMeta] = await Promise.all([
            this.enrichWorkflowFavorites(user, ids.workflow, accessibleProjectIds),
            this.enrichProjectFavorites(user, ids.project, accessibleProjects),
            this.enrichResolvedFavorites(user, 'dataTable', ids.dataTable, accessibleProjectIds),
            this.enrichFolderFavorites(user, ids.folder, accessibleProjectIds),
            this.enrichResolvedFavorites(user, 'agent', ids.agent, accessibleProjectIds),
        ]);
        return favorites.flatMap((fav) => {
            switch (fav.resourceType) {
                case 'workflow':
                    return enrichWithName(fav, workflowNames.get(fav.resourceId));
                case 'project':
                    return enrichWithName(fav, projectNames.get(fav.resourceId));
                case 'dataTable':
                    return enrichWithMeta(fav, dataTableMeta.get(fav.resourceId));
                case 'folder':
                    return enrichWithMeta(fav, folderMeta.get(fav.resourceId));
                case 'agent':
                    return enrichWithMeta(fav, agentMeta.get(fav.resourceId));
                default:
                    return [];
            }
        });
    }
    async enrichWorkflowFavorites(user, workflowIds, accessibleProjectIds) {
        const result = new Map();
        if (workflowIds.length === 0)
            return result;
        const hasGlobalAccess = (0, permissions_1.hasGlobalScope)(user, 'workflow:read');
        if (!hasGlobalAccess && accessibleProjectIds.size === 0)
            return result;
        const [workflows, sharedWorkflows] = await Promise.all([
            this.workflowRepository.findByIds(workflowIds, { fields: ['id', 'name'] }),
            hasGlobalAccess
                ? Promise.resolve([])
                : this.sharedWorkflowRepository.find({
                    select: { workflowId: true },
                    where: { workflowId: (0, typeorm_1.In)(workflowIds), projectId: (0, typeorm_1.In)([...accessibleProjectIds]) },
                }),
        ]);
        const accessibleIds = hasGlobalAccess
            ? new Set(workflows.map((wf) => wf.id))
            : new Set(sharedWorkflows.map((sw) => sw.workflowId));
        for (const wf of workflows) {
            if (accessibleIds.has(wf.id))
                result.set(wf.id, wf.name);
        }
        return result;
    }
    async enrichProjectFavorites(user, projectFavoriteIds, accessibleProjects) {
        const result = new Map(accessibleProjects.map((p) => [p.id, p.name ?? '']));
        if (projectFavoriteIds.length === 0)
            return result;
        if (!(0, permissions_1.hasGlobalScope)(user, 'project:read'))
            return result;
        const missingIds = projectFavoriteIds.filter((id) => !result.has(id));
        if (missingIds.length === 0)
            return result;
        const additional = await this.projectRepository.find({
            where: { id: (0, typeorm_1.In)(missingIds) },
            select: { id: true, name: true },
        });
        for (const p of additional) {
            result.set(p.id, p.name ?? '');
        }
        return result;
    }
    async enrichResolvedFavorites(user, resourceType, resourceIds, accessibleProjectIds) {
        const result = new Map();
        if (resourceIds.length === 0)
            return result;
        const resolver = this.resourceResolvers.get(resourceType);
        if (!resolver)
            return result;
        const hasGlobalAccess = (0, permissions_1.hasGlobalScope)(user, resolver.globalReadScope);
        const meta = await resolver.findMeta(resourceIds);
        for (const [id, resourceMeta] of meta) {
            if (hasGlobalAccess || accessibleProjectIds.has(resourceMeta.projectId)) {
                result.set(id, resourceMeta);
            }
        }
        return result;
    }
    async enrichFolderFavorites(user, folderIds, accessibleProjectIds) {
        const result = new Map();
        if (folderIds.length === 0)
            return result;
        const hasGlobalAccess = (0, permissions_1.hasGlobalScope)(user, 'folder:read');
        const folders = await this.folderRepository.find({
            where: { id: (0, typeorm_1.In)(folderIds) },
            relations: { homeProject: true },
        });
        for (const folder of folders) {
            const projectId = folder.homeProject?.id;
            if (projectId && (hasGlobalAccess || accessibleProjectIds.has(projectId))) {
                result.set(folder.id, { name: folder.name, projectId });
            }
        }
        return result;
    }
    async addFavorite(userId, resourceId, resourceType) {
        const existing = await this.userFavoriteRepository.findOne({
            where: { userId, resourceId, resourceType },
        });
        if (existing)
            return existing;
        await this.assertResourceExists(resourceId, resourceType);
        const count = await this.userFavoriteRepository.count({ where: { userId } });
        if (count >= this.MAX_FAVORITES) {
            throw new errors_1.BadRequestError(`Favorites limit of ${this.MAX_FAVORITES} reached`);
        }
        const favorite = this.userFavoriteRepository.create({ userId, resourceId, resourceType });
        return await this.userFavoriteRepository.save(favorite);
    }
    async assertResourceExists(resourceId, resourceType) {
        let exists;
        switch (resourceType) {
            case 'workflow':
                exists = await this.workflowRepository.existsBy({ id: resourceId });
                break;
            case 'project':
                exists = await this.projectRepository.existsBy({ id: resourceId });
                break;
            case 'folder':
                exists = await this.folderRepository.existsBy({ id: resourceId });
                break;
            case 'dataTable':
            case 'agent':
                exists = (await this.resourceResolvers.get(resourceType)?.exists(resourceId)) ?? false;
                break;
        }
        if (!exists) {
            throw new errors_1.NotFoundError(`${resourceType} with id "${resourceId}" not found`);
        }
    }
    async removeFavorite(userId, resourceId, resourceType) {
        const favorite = await this.userFavoriteRepository.findOne({
            where: { userId, resourceId, resourceType },
        });
        if (!favorite) {
            throw new errors_1.NotFoundError('Favorite not found');
        }
        await this.userFavoriteRepository.remove(favorite);
    }
    async deleteByResource(resourceId, resourceType) {
        await this.userFavoriteRepository.deleteByResourceId(resourceId, resourceType);
    }
    async deleteByResourceIds(resourceIds, resourceType) {
        await this.userFavoriteRepository.deleteByResourceIds(resourceIds, resourceType);
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [user_favorite_repository_1.UserFavoriteRepository, db_1.WorkflowRepository, db_1.ProjectRepository, db_1.SharedWorkflowRepository, db_1.FolderRepository, backend_services_1.FavoriteResourceResolverRegistry])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map