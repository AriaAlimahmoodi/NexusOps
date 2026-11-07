import { EventService } from '@n8n/backend-services';
import { EventRelay } from '../../events/relays/event-relay';
import { FavoritesService } from './favorites.service';
export declare class FavoritesEventRelay extends EventRelay {
    readonly eventService: EventService;
    private readonly favoritesService;
    constructor(eventService: EventService, favoritesService: FavoritesService);
    init(): void;
}
