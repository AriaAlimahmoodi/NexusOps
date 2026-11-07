import type { FavoriteResourceType } from '@n8n/api-types';
import { DataSource, Repository } from '@n8n/typeorm';
import { UserFavorite } from '../entities/user-favorite.entity';
export declare class UserFavoriteRepository extends Repository<UserFavorite> {
    constructor(dataSource: DataSource);
    findByUser(userId: string): Promise<UserFavorite[]>;
    deleteByResourceId(resourceId: string, resourceType: FavoriteResourceType): Promise<void>;
    deleteByResourceIds(resourceIds: string[], resourceType: FavoriteResourceType): Promise<void>;
}
