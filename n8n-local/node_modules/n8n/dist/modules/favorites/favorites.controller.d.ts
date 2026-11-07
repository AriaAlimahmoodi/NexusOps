import type { AuthenticatedRequest } from '@n8n/db';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    getFavorites(req: AuthenticatedRequest): Promise<(import("./database/entities/user-favorite.entity").UserFavorite & {
        resourceName: string;
    })[]>;
    addFavorite(req: AuthenticatedRequest, _res: unknown, body: AddFavoriteDto): Promise<import("./database/entities/user-favorite.entity").UserFavorite>;
    removeFavorite(req: AuthenticatedRequest, _res: unknown, resourceId: string, resourceType: string): Promise<boolean>;
}
