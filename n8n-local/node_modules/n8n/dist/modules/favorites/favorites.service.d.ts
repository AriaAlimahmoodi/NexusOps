import type { FavoriteResourceType } from '@n8n/api-types';
import { FavoriteResourceResolverRegistry } from '@n8n/backend-services';
import { FolderRepository, ProjectRepository, SharedWorkflowRepository, WorkflowRepository, type User } from '@n8n/db';
import { UserFavoriteRepository } from './database/repositories/user-favorite.repository';
export declare class FavoritesService {
    private readonly userFavoriteRepository;
    private readonly workflowRepository;
    private readonly projectRepository;
    private readonly sharedWorkflowRepository;
    private readonly folderRepository;
    private readonly resourceResolvers;
    private readonly MAX_FAVORITES;
    constructor(userFavoriteRepository: UserFavoriteRepository, workflowRepository: WorkflowRepository, projectRepository: ProjectRepository, sharedWorkflowRepository: SharedWorkflowRepository, folderRepository: FolderRepository, resourceResolvers: FavoriteResourceResolverRegistry);
    getEnrichedFavorites(user: User): Promise<(import("./database/entities/user-favorite.entity").UserFavorite & {
        resourceName: string;
    })[]>;
    private enrichWorkflowFavorites;
    private enrichProjectFavorites;
    private enrichResolvedFavorites;
    private enrichFolderFavorites;
    addFavorite(userId: string, resourceId: string, resourceType: FavoriteResourceType): Promise<import("./database/entities/user-favorite.entity").UserFavorite>;
    private assertResourceExists;
    removeFavorite(userId: string, resourceId: string, resourceType: FavoriteResourceType): Promise<void>;
    deleteByResource(resourceId: string, resourceType: FavoriteResourceType): Promise<void>;
    deleteByResourceIds(resourceIds: string[], resourceType: FavoriteResourceType): Promise<void>;
}
