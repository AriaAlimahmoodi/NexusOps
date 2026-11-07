import type { ClaimedTask } from '@n8n/scheduler';
import type { INodeExecutionData } from 'n8n-workflow';
export declare const SCHEDULE_TRIGGER_TASK_TYPE = "workflow:schedule-trigger";
export type { WorkflowNodeTaskPayload as ScheduleTriggerTaskPayload } from '../workflow-node-task-payload';
export { isWorkflowNodeTaskPayload as isScheduleTriggerTaskPayload } from '../workflow-node-task-payload';
export declare const scheduleTriggerDeduplicationKey: ({ jobId, scheduledFor, }: Pick<ClaimedTask, 'jobId' | 'scheduledFor'>) => string;
export declare const buildScheduleTriggerItem: (scheduledFor: Date, timezone: string) => INodeExecutionData;
