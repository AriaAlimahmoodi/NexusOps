import type { EventService } from '@n8n/backend-services';
import type { RetiredTask } from '@n8n/scheduler';
export declare function reportSystemTaskOverlaps(eventService: EventService, occurrences: RetiredTask[]): void;
