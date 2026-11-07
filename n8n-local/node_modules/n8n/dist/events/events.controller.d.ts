import { EventService } from '@n8n/backend-services';
import { AuthenticatedRequest } from '@n8n/db';
export declare class EventsController {
    private readonly eventService;
    constructor(eventService: EventService);
    sessionStarted(req: AuthenticatedRequest): void;
}
