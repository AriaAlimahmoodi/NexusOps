import type { EventMap, EventService } from '@n8n/backend-services';
import type { SystemTaskMetricsEventMap } from '../../events/maps/system-task-metrics.event-map';
export declare function emitSystemTaskMetric<EventName extends keyof SystemTaskMetricsEventMap>(eventService: EventService, event: EventName, payload: EventMap[EventName]): void;
