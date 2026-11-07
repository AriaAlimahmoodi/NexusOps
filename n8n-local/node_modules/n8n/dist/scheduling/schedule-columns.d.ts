import type { ScheduledJob } from '@n8n/db';
import type { ScheduleDefinition } from '@n8n/scheduler';
export type ScheduleColumns = Pick<ScheduledJob, 'kind' | 'cronExpression' | 'timezone' | 'recurrenceUnit' | 'recurrenceSize' | 'intervalSeconds' | 'fireAt'>;
export declare function scheduleColumns(schedule: ScheduleDefinition): ScheduleColumns;
export declare function rowSchedule(row: ScheduledJob): ScheduleDefinition;
