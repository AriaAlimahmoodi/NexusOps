import type { EventService } from '@n8n/backend-services';
import type { SystemTask } from '@n8n/decorators';
import { type Tracing } from 'n8n-core';
import type { SystemTaskMode } from '../../events/maps/system-task-metrics.event-map';
export type SystemTaskRunOutcome = {
    result: 'success' | 'aborted' | 'lease_lost' | 'timed_out';
    rejected: false;
} | {
    result: 'failure' | 'aborted' | 'lease_lost' | 'timed_out';
    rejected: true;
    error: unknown;
};
export declare function observeSystemTaskRun(eventService: EventService, tracing: Tracing, task: Pick<SystemTask, 'name' | 'run'>, mode: SystemTaskMode, signal: AbortSignal, leaseSignal?: AbortSignal): Promise<SystemTaskRunOutcome>;
