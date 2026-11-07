import type { FavoriteResourceType } from '@n8n/api-types';
import { User } from '@n8n/db';
export declare class UserFavorite {
    id: number;
    user: User;
    userId: string;
    resourceId: string;
    resourceType: FavoriteResourceType;
}
